import { createSupabaseAdminClient } from '@/config/supabase';
import { AuditLogEntry, AuditLogFilter } from '@/core/domain/audit.types';
import { IAuditLogRepository } from '@/core/interfaces/IAuditLogRepository';

/**
 * AuditLoggingService (#87, ADR 005)
 * Centralized, append-only, tamper-evident audit trail service.
 * Enforces:
 *  1. Zero credentials, passwords, or raw auth tokens in payloads.
 *  2. Immutable insert directly to public.audit_logs.
 *  3. Security-critical event tagging.
 */
export class AuditLoggingService implements IAuditLogRepository {
  private static instance: AuditLoggingService;

  private constructor() {}

  public static getInstance(): AuditLoggingService {
    if (!AuditLoggingService.instance) {
      AuditLoggingService.instance = new AuditLoggingService();
    }
    return AuditLoggingService.instance;
  }

  /**
   * Sanitizes any payload to ensure no sensitive credential keys leak into the audit log.
   */
  private sanitizePayload(data?: Record<string, unknown> | null): Record<string, unknown> | null {
    if (!data) return null;
    const sanitized = { ...data };
    const forbiddenKeys = [
      'password',
      'token',
      'access_token',
      'refresh_token',
      'secret',
      'service_role_key',
      'authorization',
      'cookie',
    ];

    for (const key of Object.keys(sanitized)) {
      if (forbiddenKeys.some((f) => key.toLowerCase().includes(f))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizePayload(sanitized[key] as Record<string, unknown>);
      }
    }
    return sanitized;
  }

  /**
   * Append an immutable audit log entry.
   */
  public async log(entry: AuditLogEntry): Promise<void> {
    try {
      const adminClient = createSupabaseAdminClient();

      const sanitizedBefore = this.sanitizePayload(entry.state_before);
      const sanitizedAfter = this.sanitizePayload(entry.state_after);

      const { error } = await adminClient.from('audit_logs').insert({
        actor_id: entry.actor_id || null,
        actor_role: entry.actor_role || null,
        action: entry.action,
        entity_type: entry.entity_type,
        entity_id: entry.entity_id,
        state_before: sanitizedBefore,
        state_after: sanitizedAfter,
        ip_address: entry.ip_address || null,
        request_id: entry.request_id || null,
        is_security_critical: entry.is_security_critical ?? false,
      });

      if (error) {
        console.error('[AuditLoggingService] Failed to persist audit entry:', error.message);
      }
    } catch (err) {
      console.error('[AuditLoggingService] Unexpected error inserting audit log:', err);
    }
  }

  /**
   * Helper for Authentication events (Login, Register, Logout, Failed Login)
   */
  public async logAuthEvent(params: {
    actor_id: string | null;
    actor_role?: string | null;
    action: 'AUTH_LOGIN' | 'AUTH_LOGIN_FAILED' | 'AUTH_REGISTER' | 'AUTH_LOGOUT' | 'AUTH_PASSWORD_RESET_REQUEST';
    email: string;
    ip_address?: string | null;
    request_id?: string | null;
    is_security_critical?: boolean;
    error_message?: string;
  }): Promise<void> {
    await this.log({
      actor_id: params.actor_id,
      actor_role: params.actor_role || null,
      action: params.action,
      entity_type: 'USER',
      entity_id: params.actor_id || params.email,
      state_after: {
        email: params.email,
        ...(params.error_message ? { error: params.error_message } : {}),
      },
      ip_address: params.ip_address,
      request_id: params.request_id,
      is_security_critical: params.is_security_critical ?? params.action === 'AUTH_LOGIN_FAILED',
    });
  }

  /**
   * Helper for Role Changes & Privilege Escalations (#12)
   */
  public async logRoleChange(params: {
    actor_id: string;
    actor_role: string;
    target_user_id: string;
    old_role: string;
    new_role: string;
    ip_address?: string | null;
    request_id?: string | null;
  }): Promise<void> {
    await this.log({
      actor_id: params.actor_id,
      actor_role: params.actor_role,
      action: 'PROFILE_ROLE_CHANGE',
      entity_type: 'PROFILE',
      entity_id: params.target_user_id,
      state_before: { role: params.old_role },
      state_after: { role: params.new_role },
      ip_address: params.ip_address,
      request_id: params.request_id,
      is_security_critical: true, // Role changes are always security critical
    });
  }

  /**
   * Helper for Profile Updates (#9, #10, #11, #16)
   */
  public async logProfileUpdate(params: {
    actor_id: string;
    actor_role: string;
    target_user_id: string;
    changes_before: Record<string, unknown>;
    changes_after: Record<string, unknown>;
    ip_address?: string | null;
    request_id?: string | null;
  }): Promise<void> {
    await this.log({
      actor_id: params.actor_id,
      actor_role: params.actor_role,
      action: 'PROFILE_UPDATE',
      entity_type: 'PROFILE',
      entity_id: params.target_user_id,
      state_before: params.changes_before,
      state_after: params.changes_after,
      ip_address: params.ip_address,
      request_id: params.request_id,
      is_security_critical: false,
    });
  }

  /**
   * Query audit logs with pagination and filters (Restricted to Admins)
   */
  public async query(filter: AuditLogFilter): Promise<{ entries: AuditLogEntry[]; total: number }> {
    const adminClient = createSupabaseAdminClient();
    let query = adminClient
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filter.actor_id) {
      query = query.eq('actor_id', filter.actor_id);
    }
    if (filter.action) {
      query = query.eq('action', filter.action);
    }
    if (filter.entity_type) {
      query = query.eq('entity_type', filter.entity_type);
    }
    if (filter.entity_id) {
      query = query.eq('entity_id', filter.entity_id);
    }
    if (filter.is_security_critical !== undefined) {
      query = query.eq('is_security_critical', filter.is_security_critical);
    }
    if (filter.start_date) {
      query = query.gte('created_at', filter.start_date);
    }
    if (filter.end_date) {
      query = query.lte('created_at', filter.end_date);
    }

    const limit = filter.limit ?? 50;
    const offset = filter.offset ?? 0;
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) {
      throw new Error(`Failed to query audit logs: ${error.message}`);
    }

    return {
      entries: (data || []) as AuditLogEntry[],
      total: count || 0,
    };
  }
}

