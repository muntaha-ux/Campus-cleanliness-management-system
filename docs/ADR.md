# Architectural Decision Records (ADRs)

## Project: Campus Cleanliness Management System
**Repository**: `muntaha-ux/Campus-cleanliness-management-system`  
**Stack**: Next.js (App Router, TypeScript), Supabase (PostgreSQL, Supabase Auth, Supabase Storage, Supabase Realtime, pg_cron)

---

### ADR 001: Supabase-Centric Platform Architecture
* **Status**: Accepted
* **Context**: The campus cleanliness tracking system requires reactive real-time dispatch, spatial data storage, row-level data segregation, file storage (photos and reports), and scheduled analytics.
* **Decision**:
  * **Database & Auth**: Supabase PostgreSQL with `auth.users` linked via atomic trigger to `public.profiles`. Defense-in-depth enforced via Row-Level Security (RLS) policies alongside server-side middleware and Zod schema validations.
  * **Object Storage**: Dedicated Supabase Storage buckets (`avatars`, `issue-photos`, `proof-photos`, `monthly-reports`) with bucket-level RLS policies.
  * **Realtime Engine**: Supabase Realtime (Postgres Changes & Broadcast) powering live counters (#53–#56) and in-app alerts (#65).
  * **Scheduled Jobs**: PostgreSQL `pg_cron` / Supabase Edge Functions for nightly scoring snapshots (#83–#85), monthly report generation (#86), and audit log maintenance (#87).

---

### ADR 002: Area-Only Leaderboard Scope (Issue #85)
* **Status**: Accepted
* **Context**: Public cleanliness rankings could inadvertently introduce perverse incentives or workplace toxicity if targeting individual workers.
* **Decision**:
  * Rankings evaluate **AREAS/ZONES** only (building, floor, department, hostel rollups).
  * Individual leaderboards (ranking cleaners or reporters) are strictly prohibited in v1 to preserve worker morale, comply with privacy norms, and prevent metric gaming.

---

### ADR 003: Access Control & Visibility Tiering (Issues #12, #84, #85)
* **Status**: Accepted
* **Context**: Different campus roles (Student, Teacher, Staff, Admin, Guest/Public) need tailored access to reports, statistics, and administrative workflows.
* **Decision**:
  * Authenticated users (`STUDENT`, `TEACHER`, `STAFF`, `ADMIN`) can view area rankings, aggregate hygiene scores, and historical trends.
  * Raw operational metrics, cleaner workload metrics, and granular feedback logs are restricted to `ADMIN` (and authorized supervisors).
  * Public (`anon` key) access is disabled by default; toggleable via an admin runtime flag `ENABLE_PUBLIC_LEADERBOARD` in `public.system_settings` (exposing only Top-N area names and scores).

---

### ADR 004: Temporal Handling & Campus Timezones (Issues #33, #86)
* **Status**: Accepted
* **Context**: The campus operates within a specific physical timezone (`Asia/Dhaka`), while distributed systems require UTC for synchronization.
* **Decision**:
  * All database timestamps are persisted in `UTC` (`TIMESTAMPTZ`).
  * Presentation layers and scheduled boundaries convert using `CAMPUS_TIMEZONE` (default: `Asia/Dhaka`).
  * Month boundaries run from `00:00:00` on the 1st to `23:59:59` on the last day in campus local time.
  * Monthly report generation runs at `02:00` campus time on the 1st of each month for the preceding month. Re-runs must be idempotent and generate versioned, immutable snapshots.

---

### ADR 005: Activity Logging & Immutability Enforcement (Issue #87)
* **Status**: Accepted
* **Context**: System audits must provide a tamper-evident record of all security-critical operations, role assignments, and issue state transitions.
* **Decision**:
  * Centralized, append-only `public.audit_logs` table.
  * Database-level immutability: Revoke `UPDATE` and `DELETE` privileges on `public.audit_logs` from `anon`, `authenticated`, and `service_role`; enforce via a PostgreSQL `BEFORE UPDATE OR DELETE` trigger `trg_lock_audit_logs`.
  * Retention policy: Hot storage for 12 months (in-app searchable); cold archive storage (`storage.buckets.audit-archives`) for months 13–36; purged after 36 months via a dedicated `SECURITY DEFINER` maintenance function.
  * Security-critical events (auth failures, privilege escalation, log exports) are never pruned before 36 months.
  * Zero credentials, tokens, or PII are stored in audit log payloads.

---

### ADR 006: Analytics Query Model (CQRS-Lite)
* **Status**: Accepted
* **Context**: Large operational tables (`issues`, `task_assignments`) become slow and contention-heavy when scanned for live analytics.
* **Decision**:
  * Ranking, leaderboard, and reporting queries **must never** execute transactional aggregate scans over live operational tables.
  * All analytical queries target pre-computed snapshots (`public.zone_score_snapshots`, `public.monthly_reports`).

