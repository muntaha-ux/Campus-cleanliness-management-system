import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { Database, IssueStatus, ServiceResponse } from '@/types/database.types';
import { withAuditLog } from './audit.interceptor';
import crypto from 'crypto';

export type TaskAssignmentRow = Database['public']['Tables']['task_assignments']['Row'];
export type IssueRow = Database['public']['Tables']['issues']['Row'];
export type StaffProfileRow = Database['public']['Tables']['staff_profiles']['Row'];

export interface AssignTaskDTO {
  issue_id: string;
  staff_id: string;
}

export interface ResolveTaskDTO {
  issue_id: string;
  proof_photo_urls: string[];
  resolution_notes?: string;
}

export interface VerifyResolutionDTO {
  issue_id: string;
  student_rating?: number;
  staff_rating?: number;
  feedback_notes?: string;
  is_satisfactory: boolean;
  reopen_reason?: string;
}

class DispatchService {
  /**
   * Concurrency-safe atomic task assignment RPC (#38, #39, #42)
   */
  public async assignTask(dto: AssignTaskDTO): Promise<ServiceResponse<unknown>> {
    try {
      const serverClient = await getSupabaseServerClient();
      const { data, error } = await serverClient.rpc('assign_issue_to_staff', {
        p_issue_id: dto.issue_id,
        p_staff_id: dto.staff_id,
      });

      if (error) return { data: null, error: error.message };
      return { data, error: null };
    } catch (err) {
      return { data: null, error: (err as Error).message };
    }
  }

  /**
   * Auto-dispatch single issue via workload balancing algorithm (#41)
   */
  public async autoDispatch(issueId: string): Promise<ServiceResponse<unknown>> {
    try {
      const adminClient = getSupabaseAdminClient();
      const { data, error } = await adminClient.rpc('auto_dispatch_issue', {
        p_issue_id: issueId,
      });

      if (error) return { data: null, error: error.message };
      return { data, error: null };
    } catch (err) {
      return { data: null, error: (err as Error).message };
    }
  }

  /**
   * Upload Resolution Proof Photo (#46, #78)
   * Uploads to 'proof-photos' bucket with staff verification.
   */
  public async uploadProofPhoto(
    issueId: string,
    file: Blob,
    extension: string
  ): Promise<ServiceResponse<string>> {
    try {
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedMimes.includes(file.type)) {
        return { data: null, error: 'Invalid file format. Only JPEG, PNG, and WebP are accepted.' };
      }

      const serverClient = await getSupabaseServerClient();
      const { data: { user } } = await serverClient.auth.getUser();
      if (!user) return { data: null, error: 'Unauthorized' };

      const fileId = crypto.randomUUID();
      const path = `${issueId}/proof-${fileId}.${extension}`;

      const { error: uploadErr } = await serverClient.storage
        .from('proof-photos')
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadErr) return { data: null, error: uploadErr.message };

      const { data: { publicUrl } } = serverClient.storage
        .from('proof-photos')
        .getPublicUrl(path);

      return { data: publicUrl, error: null };
    } catch (err) {
      return { data: null, error: (err as Error).message };
    }
  }

  /**
   * Staff: Start Cleaning Task (#46)
   * Transitions ASSIGNED -> IN_PROGRESS and records started_at.
   */
  public async startTask(issueId: string): Promise<ServiceResponse<IssueRow>> {
    try {
      const serverClient = await getSupabaseServerClient();
      const { data: { user } } = await serverClient.auth.getUser();

      const { data, error } = await serverClient
        .from('issues')
        .update({
          status: 'IN_PROGRESS',
          updated_at: new Date().toISOString(),
        })
        .eq('id', issueId)
        .select()
        .single();

      if (error) return { data: null, error: error.message };

      // Update started_at on active assignment
      await serverClient
        .from('task_assignments')
        .update({ started_at: new Date().toISOString() })
        .eq('issue_id', issueId)
        .eq('status', 'ACTIVE');

      await serverClient.from('issue_history').insert({
        issue_id: issueId,
        actor_id: user?.id || null,
        old_status: 'ASSIGNED',
        new_status: 'IN_PROGRESS',
        comment: 'Staff commenced on-site cleaning task.',
      });

      return { data, error: null };
    } catch (err) {
      return { data: null, error: (err as Error).message };
    }
  }

  /**
   * Staff: Mark Task Resolved (#46, #78)
   * STRICTLY requires proof_photo_urls before status transition.
   */
  public async resolveTask(dto: ResolveTaskDTO): Promise<ServiceResponse<IssueRow>> {
    try {
      if (!dto.proof_photo_urls || dto.proof_photo_urls.length === 0) {
        return {
          data: null,
          error: 'Resolution proof photo is strictly mandatory before marking task RESOLVED (#46).',
        };
      }

      const serverClient = await getSupabaseServerClient();
      const { data: { user } } = await serverClient.auth.getUser();

      const { data, error } = await serverClient
        .from('issues')
        .update({
          status: 'RESOLVED',
          proof_photo_urls: dto.proof_photo_urls,
          updated_at: new Date().toISOString(),
        })
        .eq('id', dto.issue_id)
        .select()
        .single();

      if (error) return { data: null, error: error.message };

      // Complete active task assignment
      await serverClient
        .from('task_assignments')
        .update({
          completed_at: new Date().toISOString(),
          status: 'COMPLETED',
        })
        .eq('issue_id', dto.issue_id)
        .eq('status', 'ACTIVE');

      await serverClient.from('issue_history').insert({
        issue_id: dto.issue_id,
        actor_id: user?.id || null,
        old_status: 'IN_PROGRESS',
        new_status: 'RESOLVED',
        comment: dto.resolution_notes || 'Clean-up completed with verification photo uploaded.',
      });

      // Notify original reporter for verification (#62, #78)
      if (data.reporter_id) {
        await serverClient.from('notifications').insert({
          recipient_id: data.reporter_id,
          type: 'ISSUE_RESOLVED',
          title: 'Your Cleanliness Report is Resolved',
          message: `Issue ${data.reference_number} has been resolved. Please inspect proof photos and verify.`,
          entity_id: data.id,
        });
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: (err as Error).message };
    }
  }

  /**
   * Reporter / Admin: Verify or Reopen Issue (#78, #81)
   */
  public async verifyOrReopen(dto: VerifyResolutionDTO): Promise<ServiceResponse<IssueRow>> {
    try {
      const serverClient = await getSupabaseServerClient();
      const { data: { user } } = await serverClient.auth.getUser();

      const newStatus: IssueStatus = dto.is_satisfactory ? 'VERIFIED' : 'REOPENED';

      // 1. Fetch current issue
      const { data: currentIssue, error: fetchErr } = await serverClient
        .from('issues')
        .select('*')
        .eq('id', dto.issue_id)
        .single();

      if (fetchErr || !currentIssue) {
        return { data: null, error: 'Issue not found.' };
      }

      // 2. Update issue status
      const { data, error } = await serverClient
        .from('issues')
        .update({
          status: newStatus,
          reopen_count: dto.is_satisfactory ? currentIssue.reopen_count : currentIssue.reopen_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', dto.issue_id)
        .select()
        .single();

      if (error) return { data: null, error: error.message };

      // 3. Insert verification ratings & feedback record (#79, #80)
      if (dto.is_satisfactory) {
        await serverClient.from('issue_verifications').upsert({
          issue_id: dto.issue_id,
          verified_by: user?.id || null,
          student_rating: dto.student_rating || 5,
          staff_rating: dto.staff_rating || 5,
          feedback_notes: dto.feedback_notes || 'Cleanliness verified satisfactory.',
        });
      }

      // 4. Log history
      await serverClient.from('issue_history').insert({
        issue_id: dto.issue_id,
        actor_id: user?.id || null,
        old_status: currentIssue.status,
        new_status: newStatus,
        comment: dto.is_satisfactory
          ? `Verified by user with rating ${dto.student_rating || 5}/5`
          : `Reopened: ${dto.reopen_reason || 'Unsatisfactory cleanliness'}`,
      });

      return { data, error: null };
    } catch (err) {
      return { data: null, error: (err as Error).message };
    }
  }

  /**
   * Staff: Update shift availability (#44)
   */
  public async toggleAvailability(isAvailable: boolean): Promise<ServiceResponse<StaffProfileRow>> {
    try {
      const serverClient = await getSupabaseServerClient();
      const { data: { user } } = await serverClient.auth.getUser();

      if (!user) return { data: null, error: 'Unauthorized' };

      const { data, error } = await serverClient
        .from('staff_profiles')
        .update({ is_available: isAvailable, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) return { data: null, error: error.message };
      return { data, error: null };
    } catch (err) {
      return { data: null, error: (err as Error).message };
    }
  }
}

const rawDispatchService = new DispatchService();

export const dispatchService = {
  assignTask: withAuditLog(
    {
      action: 'TASK_ASSIGNED',
      entity_type: 'TASK_ASSIGNMENT',
      entity_id: (data) => (data as { assignment_id?: string })?.assignment_id || 'unknown',
    },
    rawDispatchService.assignTask.bind(rawDispatchService)
  ),
  autoDispatch: rawDispatchService.autoDispatch.bind(rawDispatchService),
  uploadProofPhoto: rawDispatchService.uploadProofPhoto.bind(rawDispatchService),
  startTask: withAuditLog(
    {
      action: 'TASK_STATUS_CHANGED',
      entity_type: 'ISSUE',
      entity_id: (data) => (data as IssueRow)?.id || 'unknown',
    },
    rawDispatchService.startTask.bind(rawDispatchService)
  ),
  resolveTask: withAuditLog(
    {
      action: 'ISSUE_STATUS_CHANGED',
      entity_type: 'ISSUE',
      entity_id: (data) => (data as IssueRow)?.id || 'unknown',
    },
    rawDispatchService.resolveTask.bind(rawDispatchService)
  ),
  verifyOrReopen: withAuditLog(
    {
      action: 'VERIFICATION_RECORDED',
      entity_type: 'ISSUE',
      entity_id: (data) => (data as IssueRow)?.id || 'unknown',
    },
    rawDispatchService.verifyOrReopen.bind(rawDispatchService)
  ),
  toggleAvailability: rawDispatchService.toggleAvailability.bind(rawDispatchService),
};
