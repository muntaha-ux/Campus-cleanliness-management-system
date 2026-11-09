export type AuditAction =
  | 'AUTH_LOGIN'
  | 'AUTH_LOGIN_FAILED'
  | 'AUTH_REGISTER'
  | 'AUTH_LOGOUT'
  | 'AUTH_PASSWORD_RESET_REQUEST'
  | 'AUTH_PASSWORD_UPDATE'
  | 'AUTH_EMAIL_VERIFIED'
  | 'PROFILE_UPDATE'
  | 'PROFILE_ROLE_CHANGE'
  | 'PROFILE_STATUS_CHANGE'
  | 'PROFILE_PHOTO_UPLOAD'
  | 'ISSUE_CREATED'
  | 'ISSUE_EDITED'
  | 'ISSUE_CANCELLED'
  | 'ISSUE_STATUS_CHANGED'
  | 'TASK_ASSIGNED'
  | 'TASK_STATUS_CHANGED'
  | 'REPORT_GENERATED'
  | 'SETTINGS_UPDATED'
  | 'AUDIT_LOG_EXPORTED';

export type AuditEntityType =
  | 'USER'
  | 'PROFILE'
  | 'STAFF_PROFILE'
  | 'ISSUE'
  | 'TASK_ASSIGNMENT'
  | 'VERIFICATION'
  | 'SYSTEM_SETTINGS'
  | 'MONTHLY_REPORT'
  | 'AUDIT_LOG';

export interface AuditLogEntry {
  id?: number;
  actor_id: string | null;
  actor_role: string | null;
  action: AuditAction | string;
  entity_type: AuditEntityType | string;
  entity_id: string;
  state_before?: Record<string, unknown> | null;
  state_after?: Record<string, unknown> | null;
  ip_address?: string | null;
  request_id?: string | null;
  is_security_critical?: boolean;
  created_at?: string;
}

export interface AuditLogFilter {
  actor_id?: string;
  action?: string;
  entity_type?: string;
  entity_id?: string;
  is_security_critical?: boolean;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

