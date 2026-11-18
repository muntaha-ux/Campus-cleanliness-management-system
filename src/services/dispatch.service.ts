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
  checklist_items?: string[];
}

export interface ApproveWorkDTO {
  issue_id: string;
  notes?: string;
  rating?: number;
}

export interface RequestReworkDTO {
  issue_id: string;
  reason: string;
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

      // Send assignment notification to cleaner (Figure 1 & 3: Assign Task -> Send Notification)
      try {
        await serverClient.from('notifications').insert({
          recipient_id: dto.staff_id,
          type: 'TASK_ASSIGNED',
          title: 'New Cleanliness Work Order',
          message: 'You have been assigned a new clean-up task. Please check your task board.',
          entity_id: dto.issue_id,
        });
      } catch {
        // Non-blocking notification
      }

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
   * Staff: Start Cleaning Task (#46, Figure 1 & 3: Upload Before/After Photos)
   * Transitions ASSIGNED -> IN_PROGRESS and records started_at and optional before photo.
   */
  public async startTask(issueId: string, beforePhotoUrl?: string): Promise<ServiceResponse<IssueRow>> {
    try {
      const serverClient = await getSupabaseServerClient();
      const { data: { user } } = await serverClient.auth.getUser();

      const updatePayload: Database['public']['Tables']['issues']['Update'] = {
        status: 'IN_PROGRESS',
        updated_at: new Date().toISOString(),
      };

      if (beforePhotoUrl) {
        // Append before photo to issue photo_urls
        const { data: current } = await serverClient
          .from('issues')
          .select('photo_urls')
          .eq('id', issueId)
          .single();

        const existingPhotos = (current?.photo_urls as string[]) || [];
        updatePayload.photo_urls = [...existingPhotos, beforePhotoUrl];
      }

      const { data, error } = await serverClient
        .from('issues')
        .update(updatePayload)
        .eq('id', issueId)
        .select()
        .single();

      if (error || !data) return { data: null, error: error?.message || 'Failed to start task' };

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
        comment: beforePhotoUrl
          ? 'Staff commenced on-site cleaning task and captured initial Before-Photo.'
          : 'Staff commenced on-site cleaning task.',
      });

      return { data: data as IssueRow, error: null };
    } catch (err) {
      return { data: null, error: (err as Error).message };
    }
  }

  /**
   * Staff: Mark Task Resolved (#46, #78, Figure 1 & 3)
   * STRICTLY requires proof_photo_urls before status transition.
   * Notifies both Reporter and Supervisor for inspection (Figure 3).
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

      if (error || !data) return { data: null, error: error?.message || 'Failed to resolve task' };

      // Complete active task assignment
      await serverClient
        .from('task_assignments')
        .update({
          completed_at: new Date().toISOString(),
          status: 'COMPLETED',
        })
        .eq('issue_id', dto.issue_id)
        .eq('status', 'ACTIVE');

      const checklistSummary = dto.checklist_items && dto.checklist_items.length > 0
        ? ` Checklist items completed (${dto.checklist_items.length}).`
        : '';

      await serverClient.from('issue_history').insert({
        issue_id: dto.issue_id,
        actor_id: user?.id || null,
        old_status: 'IN_PROGRESS',
        new_status: 'RESOLVED',
        comment: (dto.resolution_notes || 'Clean-up completed with verification photo uploaded.') + checklistSummary,
      });

      // 1. Notify original reporter for verification (#62, #78)
      const resolvedIssue = data as IssueRow;
      if (resolvedIssue.reporter_id) {
        await serverClient.from('notifications').insert({
          recipient_id: resolvedIssue.reporter_id,
          type: 'ISSUE_RESOLVED',
          title: 'Your Cleanliness Report is Resolved',
          message: `Issue ${resolvedIssue.reference_number} has been resolved. Please inspect proof photos and verify.`,
          entity_id: resolvedIssue.id,
        });
      }

      // 2. Notify Supervisors (Figure 3: Submit Completion -> Triggers notification to Supervisor)
      try {
        const adminClient = getSupabaseAdminClient();
        const { data: supervisors } = await adminClient
          .from('profiles')
          .select('id')
          .in('role', ['ADMIN', 'TEACHER'])
          .limit(10);

        if (supervisors && supervisors.length > 0) {
          const notifs = supervisors.map((s) => ({
            recipient_id: s.id,
            type: 'TASK_COMPLETED_PENDING_REVIEW',
            title: `Review Work: ${resolvedIssue.reference_number}`,
            message: `Cleaner submitted completion with after photos. Awaiting supervisor sign-off.`,
            entity_id: resolvedIssue.id,
          }));
          await adminClient.from('notifications').insert(notifs);
        }
      } catch {
        // Non-blocking notification dispatch
      }

      return { data: resolvedIssue, error: null };
    } catch (err) {
      return { data: null, error: (err as Error).message };
    }
  }

  /**
   * Supervisor: Approve Work & Close Issue (Figure 1 & 3: Review Work -> Approved? -> Yes -> Approve Work)
   * System Closes Issue, Calculates SLA Metrics, and Updates Analytics.
   */
  public async approveWork(dto: ApproveWorkDTO): Promise<ServiceResponse<IssueRow>> {
    try {
      const serverClient = await getSupabaseServerClient();
      const { data: { user } } = await serverClient.auth.getUser();

      const { data: currentIssue, error: fetchErr } = await serverClient
        .from('issues')
        .select('*')
        .eq('id', dto.issue_id)
        .single();

      if (fetchErr || !currentIssue) {
        return { data: null, error: 'Issue not found.' };
      }

      const closedAt = new Date();
      const reportedAt = new Date(currentIssue.created_at);
      const resolutionMinutes = Math.max(1, Math.round((closedAt.getTime() - reportedAt.getTime()) / 60000));
      const slaMet = currentIssue.sla_deadline ? closedAt <= new Date(currentIssue.sla_deadline) : true;

      // Transition to VERIFIED (StateClosed)
      const { data, error } = await serverClient
        .from('issues')
        .update({
          status: 'VERIFIED',
          updated_at: closedAt.toISOString(),
        })
        .eq('id', dto.issue_id)
        .select()
        .single();

      if (error || !data) return { data: null, error: error?.message || 'Failed to approve work' };

      // Ensure assignment marked completed
      await serverClient
        .from('task_assignments')
        .update({
          completed_at: closedAt.toISOString(),
          status: 'COMPLETED',
        })
        .eq('issue_id', dto.issue_id);

      // Record Supervisor Verification & Quality Rating
      await serverClient.from('issue_verifications').upsert({
        issue_id: dto.issue_id,
        verified_by: user?.id || null,
        student_rating: dto.rating || 5,
        staff_rating: 5,
        feedback_notes: dto.notes || `Supervisor approved work order. SLA: ${slaMet ? 'Target Met ✓' : 'Breached'} (${resolutionMinutes} mins)`,
      });

      // Audit History
      await serverClient.from('issue_history').insert({
        issue_id: dto.issue_id,
        actor_id: user?.id || null,
        old_status: (currentIssue as IssueRow).status,
        new_status: 'VERIFIED',
        comment: `Supervisor approved work order. SLA met: ${slaMet ? 'YES' : 'NO'} (${resolutionMinutes}m). ${dto.notes || ''}`.trim(),
      });

      // Send Notification to Reporter
      if (currentIssue.reporter_id) {
        await serverClient.from('notifications').insert({
          recipient_id: currentIssue.reporter_id,
          type: 'ISSUE_VERIFIED',
          title: `Report Verified: ${currentIssue.reference_number}`,
          message: `The supervisor has verified and approved the clean-up work order. Thank you for your civic contribution.`,
          entity_id: currentIssue.id,
        });
      }

      // Send Notification to Assigned Staff / Cleaner
      const { data: assignment } = await serverClient
        .from('task_assignments')
        .select('staff_id')
        .eq('issue_id', dto.issue_id)
        .order('assigned_at', { ascending: false })
        .limit(1)
        .single();

      if (assignment?.staff_id) {
        await serverClient.from('notifications').insert({
          recipient_id: assignment.staff_id,
          type: 'TASK_APPROVED',
          title: `Work Order Approved: ${currentIssue.reference_number}`,
          message: `Supervisor approved your clean-up. Quality Rating: ${dto.rating || 5}/5. SLA: ${slaMet ? 'Met ✓' : 'Breached'}.`,
          entity_id: currentIssue.id,
        });
      }

      return { data: data as IssueRow, error: null };
    } catch (err) {
      return { data: null, error: (err as Error).message };
    }
  }

  /**
   * Supervisor: Request Rework / Reopen Work (Figure 1 & 3: Review Work -> Approved? -> No -> Return to Cleaner)
   */
  public async requestRework(dto: RequestReworkDTO): Promise<ServiceResponse<IssueRow>> {
    try {
      const serverClient = await getSupabaseServerClient();
      const { data: { user } } = await serverClient.auth.getUser();

      const { data: currentIssue, error: fetchErr } = await serverClient
        .from('issues')
        .select('*')
        .eq('id', dto.issue_id)
        .single();

      if (fetchErr || !currentIssue) {
        return { data: null, error: 'Issue not found.' };
      }

      const { data, error } = await serverClient
        .from('issues')
        .update({
          status: 'IN_PROGRESS',
          reopen_count: ((currentIssue as IssueRow).reopen_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', dto.issue_id)
        .select()
        .single();

      if (error || !data) return { data: null, error: error?.message || 'Failed to request rework' };

      // Reactivate task assignment
      await serverClient
        .from('task_assignments')
        .update({ status: 'ACTIVE' })
        .eq('issue_id', dto.issue_id);

      // Record timeline history
      await serverClient.from('issue_history').insert({
        issue_id: dto.issue_id,
        actor_id: user?.id || null,
        old_status: 'RESOLVED',
        new_status: 'IN_PROGRESS',
        comment: `Supervisor rejected work and requested rework: ${dto.reason}`,
      });

      // Send Notification to Cleaner
      const { data: assignment } = await serverClient
        .from('task_assignments')
        .select('staff_id')
        .eq('issue_id', dto.issue_id)
        .order('assigned_at', { ascending: false })
        .limit(1)
        .single();

      if (assignment?.staff_id) {
        await serverClient.from('notifications').insert({
          recipient_id: assignment.staff_id,
          type: 'REWORK_REQUESTED',
          title: `Rework Required: ${(currentIssue as IssueRow).reference_number}`,
          message: `Supervisor inspected the facility and requested rework: ${dto.reason}. Please re-clean and submit fresh proof.`,
          entity_id: dto.issue_id,
        });
      }

      return { data: data as IssueRow, error: null };
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

      const issueObj = currentIssue as IssueRow;

      // 2. Update issue status
      const { data, error } = await serverClient
        .from('issues')
        .update({
          status: newStatus,
          reopen_count: dto.is_satisfactory ? issueObj.reopen_count : issueObj.reopen_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', dto.issue_id)
        .select()
        .single();

      if (error || !data) return { data: null, error: error?.message || 'Failed to update issue status' };

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
        old_status: issueObj.status,
        new_status: newStatus,
        comment: dto.is_satisfactory
          ? `Verified by user with rating ${dto.student_rating || 5}/5`
          : `Reopened: ${dto.reopen_reason || 'Unsatisfactory cleanliness'}`,
      });

      return { data: data as IssueRow, error: null };
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

      if (error || !data) return { data: null, error: error?.message || 'Failed to update availability' };
      return { data: data as StaffProfileRow, error: null };
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
  approveWork: withAuditLog(
    {
      action: 'WORK_APPROVED',
      entity_type: 'ISSUE',
      entity_id: (data) => (data as IssueRow)?.id || 'unknown',
    },
    rawDispatchService.approveWork.bind(rawDispatchService)
  ),
  requestRework: withAuditLog(
    {
      action: 'REWORK_REQUESTED',
      entity_type: 'ISSUE',
      entity_id: (data) => (data as IssueRow)?.id || 'unknown',
    },
    rawDispatchService.requestRework.bind(rawDispatchService)
  ),
  toggleAvailability: rawDispatchService.toggleAvailability.bind(rawDispatchService),
};
