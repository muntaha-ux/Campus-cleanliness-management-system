import { AuditLogEntry, AuditLogFilter } from '../domain/audit.types';

export interface IAuditLogRepository {
  log(entry: AuditLogEntry): Promise<void>;
  query(filter: AuditLogFilter): Promise<{ entries: AuditLogEntry[]; total: number }>;
}

