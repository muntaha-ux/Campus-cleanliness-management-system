import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { Database, IssuePriority, IssueStatus, ServiceResponse } from '@/types/database.types';
import { withAuditLog } from './audit.interceptor';
import crypto from 'crypto';

export type IssueRow = Database['public']['Tables']['issues']['Row'];
export type IssueInsert = Database['public']['Tables']['issues']['Insert'];
export type LocationRow = Database['public']['Tables']['locations']['Row'];

export interface CreateIssueDTO {
  location_id: string;
  category: string;
  description: string;
  priority?: IssuePriority;
  photo_urls?: string[];
  is_anonymous?: boolean;
  client_ip?: string;
}

export interface DuplicateCandidate {
  id: string;
  reference_number: string;
  category: string;
  description: string;
  priority: IssuePriority;
  status: IssueStatus;
  created_at: string;
}

class IssueService {
  /**
   * Calculate SLA Deadline based on priority (#28)
   */
  private calculateSlaDeadline(priority: IssuePriority = 'MEDIUM'): string {
    const now = new Date();
    const slaHours: Record<IssuePriority, number> = {
      EMERGENCY: 2,
      HIGH: 6,
      MEDIUM: 24,
      LOW: 72,
    };
    now.setHours(now.getHours() + (slaHours[priority] || 24));
    return now.toISOString();
  }

  /**
   * Generate Deterministic Reference Number: CCMS-YYYYMMDD-XXXX (#32)
   */
  private generateReferenceNumber(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `CCMS-${yyyy}${mm}${dd}-${randomHex}`;
  }

  /**
   * Check for duplicate reports at the same location & category within 6 hours (#31)
   */
  public async checkDuplicates(
    locationId: string,
    category: string
  ): Promise<ServiceResponse<DuplicateCandidate[]>> {
    try {
      const serverClient = await getSupabaseServerClient();
      const { data, error } = await serverClient.rpc('check_duplicate_issue', {
        p_location_id: locationId,
        p_category: category,
      });

      if (error) return { data: null, error: error.message };
      return { data: (data || []) as DuplicateCandidate[], error: null };
    } catch (err) {
      return { data: null, error: (err as Error).message };
    }
  }

  /**
   * Upload Issue Photo to 'issue-attachments' Bucket (#21, #22)
   * Storage path: {location_id}/{year}-{month}/{uuid}.{ext}
   */
  public async uploadPhoto(
    locationId: string,
    file: Blob,
    extension: string
  ): Promise<ServiceResponse<string>> {
    try {
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedMimes.includes(file.type)) {
        return { data: null, error: 'Invalid file format. Only JPEG, PNG, and WebP images are allowed.' };
      }

      if (file.size > 10 * 1024 * 1024) {
        return { data: null, error: 'File size exceeds maximum 10MB limit.' };
      }

      const serverClient = await getSupabaseServerClient();
      const now = new Date();
      const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const fileId = crypto.randomUUID();
      const path = `${locationId}/${yearMonth}/${fileId}.${extension}`;

      const { error: uploadErr } = await serverClient.storage
        .from('issue-attachments')
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadErr) return { data: null, error: uploadErr.message };

      const { data: { publicUrl } } = serverClient.storage
        .from('issue-attachments')
        .getPublicUrl(path);

      return { data: publicUrl, error: null };
    } catch (err) {
      return { data: null, error: (err as Error).message };
    }
  }

  /**
   * Intake and Submit Cleanliness Issue (#3, #18, #30)
   * Handles anonymous scrubbing while retaining salted anti-gaming fingerprint.
   */
  public async createIssue(dto: CreateIssueDTO): Promise<ServiceResponse<IssueRow>> {
    try {
      const serverClient = await getSupabaseServerClient();
      const { data: { user } } = await serverClient.auth.getUser();

      const referenceNumber = this.generateReferenceNumber();
      const slaDeadline = this.calculateSlaDeadline(dto.priority);

      let reporterId: string | null = null;
      let anonymousFingerprint: string | null = null;

      if (dto.is_anonymous) {
        // Strip reporter identity, compute salted abuse fingerprint (#30)
        reporterId = null;
        const salt = process.env.SUPABASE_SERVICE_ROLE_KEY || 'default-salt';
        const rawFingerprint = `${dto.client_ip || 'unknown'}-${user?.id || 'anon'}`;
        anonymousFingerprint = crypto.createHmac('sha256', salt).update(rawFingerprint).digest('hex');
      } else {
        reporterId = user?.id || null;
      }

      const insertPayload: IssueInsert = {
        reference_number: referenceNumber,
        reporter_id: reporterId,
        is_anonymous: dto.is_anonymous ?? false,
        anonymous_fingerprint: anonymousFingerprint,
        location_id: dto.location_id,
        category: dto.category,
        description: dto.description,
        priority: dto.priority || 'MEDIUM',
        status: 'SUBMITTED',
        photo_urls: dto.photo_urls || [],
        sla_deadline: slaDeadline,
      };

      const { data, error } = dto.is_anonymous
        ? await getSupabaseAdminClient().from('issues').insert(insertPayload).select().single()
        : await serverClient.from('issues').insert(insertPayload).select().single();

      if (error || !data) return { data: null, error: error?.message || 'Failed to insert issue' };

      // Log initial timeline history (#35)
      const auditDb = dto.is_anonymous ? getSupabaseAdminClient() : serverClient;
      await auditDb.from('issue_history').insert({
        issue_id: data.id,
        actor_id: reporterId,
        new_status: 'SUBMITTED',
        comment: 'Issue submitted into the campus cleanliness triage queue.',
      });

      // If Emergency, trigger instant background auto-dispatch (#29, #41)
      if (dto.priority === 'EMERGENCY') {
        const adminClient = getSupabaseAdminClient();
        await adminClient.rpc('auto_dispatch_issue', { p_issue_id: data.id });
      }

      return { data: data as IssueRow, error: null };
    } catch (err) {
      return { data: null, error: (err as Error).message };
    }
  }

  /**
   * Edit Issue Description/Photos (#36)
   * Only allowed while status is 'SUBMITTED' (enforced via DB RLS and Service check).
   */
  public async editIssue(
    issueId: string,
    updates: { description?: string; photo_urls?: string[]; priority?: IssuePriority }
  ): Promise<ServiceResponse<IssueRow>> {
    try {
      const serverClient = await getSupabaseServerClient();
      const updatePayload: Database['public']['Tables']['issues']['Update'] = {
        updated_at: new Date().toISOString(),
      };
      if (updates.description !== undefined) updatePayload.description = updates.description;
      if (updates.photo_urls !== undefined) updatePayload.photo_urls = updates.photo_urls;
      if (updates.priority !== undefined) updatePayload.priority = updates.priority;

      const { data, error } = await serverClient
        .from('issues')
        .update(updatePayload)
        .eq('id', issueId)
        .eq('status', 'SUBMITTED')
        .select()
        .single();

      if (error) return { data: null, error: error.message };
      return { data: data as IssueRow, error: null };
    } catch (err) {
      return { data: null, error: (err as Error).message };
    }
  }

  /**
   * Cancel Issue (#37)
   */
  public async cancelIssue(issueId: string, reason: string): Promise<ServiceResponse<IssueRow>> {
    try {
      const serverClient = await getSupabaseServerClient();
      const { data: { user } } = await serverClient.auth.getUser();

      const { data, error } = await serverClient
        .from('issues')
        .update({
          status: 'CANCELLED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', issueId)
        .select()
        .single();

      if (error || !data) return { data: null, error: error?.message || 'Failed to cancel issue' };

      await serverClient.from('issue_history').insert({
        issue_id: issueId,
        actor_id: user?.id || null,
        old_status: (data as IssueRow).status,
        new_status: 'CANCELLED',
        comment: `Issue cancelled: ${reason}`,
      });

      return { data: data as IssueRow, error: null };
    } catch (err) {
      return { data: null, error: (err as Error).message };
    }
  }

  /**
   * Get Issue Detail with History and Location (#34, #35)
   */
  public async getIssueById(issueId: string): Promise<ServiceResponse<IssueRow & { location: LocationRow }>> {
    try {
      const serverClient = await getSupabaseServerClient();
      const { data, error } = await serverClient
        .from('issues')
        .select('*, location:locations(*)')
        .eq('id', issueId)
        .single();

      if (error) return { data: null, error: error.message };
      return { data: data as unknown as IssueRow & { location: LocationRow }, error: null };
    } catch (err) {
      return { data: null, error: (err as Error).message };
    }
  }
}

const rawIssueService = new IssueService();

export const issueService = {
  checkDuplicates: rawIssueService.checkDuplicates.bind(rawIssueService),
  uploadPhoto: rawIssueService.uploadPhoto.bind(rawIssueService),
  createIssue: withAuditLog(
    {
      action: 'ISSUE_CREATED',
      entity_type: 'ISSUE',
      entity_id: (data) => (data as IssueRow)?.id || 'unknown',
    },
    rawIssueService.createIssue.bind(rawIssueService)
  ),
  editIssue: withAuditLog(
    {
      action: 'ISSUE_EDITED',
      entity_type: 'ISSUE',
      entity_id: (data) => (data as IssueRow)?.id || 'unknown',
    },
    rawIssueService.editIssue.bind(rawIssueService)
  ),
  cancelIssue: withAuditLog(
    {
      action: 'ISSUE_CANCELLED',
      entity_type: 'ISSUE',
      entity_id: (data) => (data as IssueRow)?.id || 'unknown',
    },
    rawIssueService.cancelIssue.bind(rawIssueService)
  ),
  getIssueById: rawIssueService.getIssueById.bind(rawIssueService),
};
