import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { Json, ServiceResponse } from '@/types/database.types';

export interface AuditLogParams {
  action: string;
  entity_type: string;
  entity_id: string | ((resultData: unknown) => string);
  state_before?: Record<string, unknown> | null | (() => Promise<Record<string, unknown> | null>);
  state_after?: Record<string, unknown> | null | ((resultData: unknown) => Record<string, unknown> | null);
  is_security_critical?: boolean;
}

/**
 * Strips confidential keys (passwords, tokens, keys) before logging.
 */
function sanitizeAuditPayload(data?: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== 'object') return null;
  const sanitized = { ...(data as Record<string, unknown>) };
  const sensitiveKeys = ['password', 'token', 'secret', 'authorization', 'cookie', 'jwt'];

  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeAuditPayload(sanitized[key]);
    }
  }
  return sanitized;
}

/**
 * Higher-order interceptor wrapping state-mutating service calls with tamper-evident audit logging.
 */
export function withAuditLog<TArgs extends unknown[], TReturn>(
  auditConfig: AuditLogParams,
  fn: (...args: TArgs) => Promise<ServiceResponse<TReturn>>
): (...args: TArgs) => Promise<ServiceResponse<TReturn>> {
  return async (...args: TArgs): Promise<ServiceResponse<TReturn>> => {
    // 1. Capture actor information from active session
    let actorId: string | null = null;
    let actorRole: string | null = null;

    try {
      const serverClient = await getSupabaseServerClient();
      const { data: { user } } = await serverClient.auth.getUser();
      if (user) {
        actorId = user.id;
        actorRole = (user.user_metadata?.role as string) || null;
      }
    } catch {
      // In background workers, actorId remains null
    }

    // 2. Fetch state before if provided
    let beforeState: Record<string, unknown> | null = null;
    if (typeof auditConfig.state_before === 'function') {
      try {
        beforeState = await auditConfig.state_before();
      } catch (err) {
        console.warn('[AuditInterceptor] Failed to resolve state_before:', err);
      }
    } else if (auditConfig.state_before) {
      beforeState = auditConfig.state_before;
    }

    // 3. Execute the core business action
    const response = await fn(...args);

    // 4. If execution succeeded, append immutable audit record
    if (!response.error) {
      try {
        const adminClient = getSupabaseAdminClient();
        const resolvedEntityId =
          typeof auditConfig.entity_id === 'function'
            ? auditConfig.entity_id(response.data)
            : auditConfig.entity_id;

        const afterState =
          typeof auditConfig.state_after === 'function'
            ? auditConfig.state_after(response.data)
            : auditConfig.state_after ?? (response.data as Record<string, unknown>);

        await adminClient.from('audit_logs').insert({
          actor_id: actorId,
          actor_role: actorRole,
          action: auditConfig.action,
          entity_type: auditConfig.entity_type,
          entity_id: String(resolvedEntityId),
          state_before: (sanitizeAuditPayload(beforeState) as Json) || null,
          state_after: (sanitizeAuditPayload(afterState) as Json) || null,
          is_security_critical: auditConfig.is_security_critical ?? false,
        });
      } catch (auditError) {
        // Never fail the primary user request if logging encounters a non-fatal failure
        console.error('[AuditInterceptor] Failed to write audit record:', auditError);
      }
    }

    return response;
  };
}
