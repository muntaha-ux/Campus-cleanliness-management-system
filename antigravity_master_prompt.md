# MISSION & ARCHITECTURAL CONTEXT

You are an elite Principal Software Architect and Lead Systems Engineer leading the complete end-to-end design, implementation, and deployment of the **Campus Cleanliness Management System** (`muntaha-ux/Campus-cleanliness-management-system`), powered by **Supabase** (PostgreSQL, Supabase Auth, Supabase Storage, Supabase Realtime, and `pg_cron`).

The system tracks 87 discrete functional items across 7 core functional domains:

1. **Authentication & User Management** (Issues #1–#2, #8–#17)
2. **Issue Reporting & Submission** (Issues #3–#7, #18–#37)
3. **Staff & Task Assignment Engine** (Issues #38–#47)
4. **Dashboards & Real-Time Monitoring** (Issues #48–#57)
5. **Multi-Channel Notification Infrastructure** (Issues #58–#67)
6. **Search, Filtering & Indexing** (Issues #68–#75)
7. **Analytics, Verification, Ratings & Governance** (Issues #76–#87)

Because the repository issue bodies are one-line stubs, you must not guess requirements. You must strictly enforce the technical specifications, Supabase RLS policies, database schemas, mathematical algorithms, and architectural guardrails defined in this prompt.

## 1. ARCHITECTURAL DECISION RECORDS (ADRs) & DEFAULTS

Do not pause to ask for clarification on these items. Implement the following defaults directly and document them in `docs/ADR.md`:

1. **Supabase Stack Architecture**:
   * **Database & Auth**: Use Supabase PostgreSQL with `auth.users` linked via a trigger to `public.profiles`. Enforce defense-in-depth using **Row-Level Security (RLS)** alongside backend API validation.
   * **Object Storage**: Use **Supabase Storage** buckets (`avatars`, `issue-photos`, `proof-photos`, `monthly-reports`) with strict storage RLS policies.
   * **Realtime Engine**: Use **Supabase Realtime** (Postgres Changes & Broadcast) for live dashboard counters (#53–#56) and instant in-app notifications (#65).
   * **Scheduled Jobs**: Use PostgreSQL `pg_cron` / Supabase Edge Functions for nightly scoring snapshots (#83–#85), monthly report generation (#86), and audit log archival (#87).

2. **Leaderboard Scope (Issue #85)**:
   * Rank **AREAS/ZONES** only (building, floor, department, hostel rollups).
   * Individual leaderboards (ranking cleaners or reporters) are strictly prohibited in v1 to preserve worker morale, comply with privacy norms, and prevent metric gaming.

3. **Access Control & Visibility Tiering (Issues #12, #84, #85)**:
   * Authenticated users (`STUDENT`, `TEACHER`, `STAFF`, `ADMIN`) can view area rankings, aggregate hygiene scores, and historical trends.
   * Raw operational metrics, cleaner workload metrics, and granular feedback logs are restricted to `ADMIN` (and supervisors).
   * Public (`anon` key) access is disabled by default; toggleable via an admin runtime flag `ENABLE_PUBLIC_LEADERBOARD` in a `system_settings` table (exposing only Top-N area names and scores).

4. **Temporal Handling & Campus Timezones (Issues #33, #86)**:
   * All persistence layers store timestamps in `UTC` (`TIMESTAMPTZ`).
   * UI presentations and scheduled boundaries convert using `CAMPUS_TIMEZONE` (default: `Asia/Dhaka`).
   * Month boundaries run from `00:00:00` on the 1st to `23:59:59` on the last day in campus local time.
   * Monthly report generation runs at `02:00` campus time on the 1st of each month for the preceding month. Re-runs must be idempotent and generate versioned, immutable snapshots.

5. **Activity Logging & Auditing (Issue #87)**:
   * Centralized, append-only `public.audit_logs` table.
   * Database-level immutability: Revoke `UPDATE` and `DELETE` privileges on `public.audit_logs` from `anon`, `authenticated`, and `service_role`; enforce via PostgreSQL rules/triggers.
   * Retention policy: Hot storage for 12 months (in-app searchable); cold archive storage (`storage.buckets.audit-archives`) for months 13–36; purged after 36 months via a dedicated `SECURITY DEFINER` maintenance function.
   * Security-critical events (auth failures, privilege escalation, log exports) are never pruned before 36 months. Zero credentials, tokens, or PII may be stored in payloads.

6. **Analytics Query Model (CQRS-Lite)**:
   * Ranking, leaderboard, and reporting queries **must never** run transactional aggregate scans over live operational tables (`issues`, `task_assignments`).
   * All analytical queries must target pre-computed snapshots (`zone_score_snapshots`, `monthly_reports`).

## 2. COMPLETE 87-FEATURE BACKLOG SPECIFICATION

*(Note: Items #1–#7 are initial specification items consolidated into the standardized modules #8–#87 below).*

### Module 1: Authentication & User Management (#1–#2, #8–#17)
* **#1 / #8**: User Registration and Login (Supabase Auth JWT + Refresh Token rotation, rate-limited).
* **#2 / #9**: Student Profile Management (Department, student ID, hostel/hall association, activity summary in `public.profiles`).
* **#10**: Teacher Profile Management (Faculty department, designation, office room reference).
* **#11**: Admin Profile Management (System-wide configuration rights, audit access, privilege management).
* **#12**: Role-Based Access Control (Custom JWT claims / `public.profiles.role` verified via Supabase RLS policies and API middleware for `STUDENT`, `TEACHER`, `STAFF`, `ADMIN`).
* **#13**: Secure Password Management (Managed via Supabase Auth password complexity policies and secure update flows).
* **#14**: Email Verification (Supabase Auth email confirmation required before non-anonymous reporting).
* **#15**: Forgot Password and Reset (Supabase Auth `resetPasswordForEmail` with time-bound recovery redirect).
* **#16**: User Account Activation and Deactivation (Admin soft-lock/ban via `profiles.is_active` and `auth.admin.updateUserById` ban duration).
* **#17**: User Profile Photo (Upload to Supabase Storage `avatars` bucket with image transformation and MIME validation).

### Module 2: Issue Reporting & Submission (#3–#7, #18–#37)
* **#3 / #18**: Cleanliness Issue Reporting (Core intake pipeline).
* **#4 / #19**: Issue Description (Rich text/sanitized markdown validation, min/max length constraints).
* **#5 / #20**: Issue Categories (Configurable taxonomy: `WASHROOM_HYGIENE`, `TRASH_OVERFLOW`, `SPILL_HAZARD`, `PEST_CONTROL`, `MEDICAL_BIOHAZARD`, `GENERAL_LITTER`).
* **#6 / #21**: Photo Upload & **#22**: Multiple Photo Upload (Up to 5 photos per report stored in Supabase Storage `issue-photos` bucket, EXIF stripping, max 5MB per file).
* **#7 / #23**: Location-Based Reporting (QR code scan autofill + hierarchical dropdowns).
* **#24**: Building Selection, **#25**: Floor Selection, **#26**: Room Selection, **#27**: Specific Area Selection.
* **#28**: Issue Priority Selection (`LOW`, `MEDIUM`, `HIGH`, `EMERGENCY` with dynamic SLA calculation).
* **#29**: Emergency Cleanliness Report (Immediate bypass of standard queue, instant high-priority Supabase Realtime broadcast to Admin & available Staff).
* **#30**: Anonymous Issue Reporting (Submits with `is_anonymous = TRUE`, strips `reporter_id` from public/staff views via secure DB view or column masking while retaining internal anti-abuse rate-limit hash).
* **#31**: Duplicate Issue Detection (Spatial-temporal proximity matching within 6 hours at the same location/category).
* **#32**: Issue Reference Number (Deterministic human-readable ID: `CCMS-YYYYMMDD-XXXX`).
* **#33**: Issue Submission Timestamp (UTC storage with local campus timezone formatting).
* **#34**: Issue Status Tracking (`SUBMITTED` -> `ASSIGNED` -> `IN_PROGRESS` -> `RESOLVED` -> `VERIFIED` / `REOPENED` / `CANCELLED`).
* **#35**: Issue History (Immutable timeline of state transitions, comments, and assignee changes).
* **#36**: Issue Editing (Reporter can edit description/photos only while status is `SUBMITTED`, enforced by RLS).
* **#37**: Issue Cancellation (Reporter can cancel while `SUBMITTED`; Admin can cancel at any state with mandatory reason).

### Module 3: Staff & Task Assignment (#38–#47)
* **#38**: Complaint Assignment & **#39**: Cleaning Staff Assignment (Core work-order binding).
* **#40**: Department Assignment (Routing issues to specialized facility units: Janitorial, Plumbing, Grounds, Waste).
* **#41**: Automatic Issue Assignment (Load-balanced database RPC / Edge Function weighted by active task priority and shift status).
* **#42**: Manual Issue Assignment (Admin override and reassignment interface).
* **#43**: Cleaning Staff Profile (Skills, assigned zones, contact info, performance summary).
* **#44**: Cleaning Staff Availability (On-shift/Off-shift toggle, leave status, real-time availability check).
* **#45**: Cleaning Staff Workload (Active task count vs `max_concurrent_tasks` threshold).
* **#46**: Cleaning Task Management (Staff mobile-first view: Accept task -> Start work -> Upload mandatory "After" proof photos to `proof-photos` bucket -> Mark `RESOLVED`).
* **#47**: Cleaning Schedule Management (Shift definitions, recurring routine cleaning vs ad-hoc complaint tasks).

### Module 4: Dashboards & Live Counters (#48–#57)
* **#48**: Admin Dashboard (Campus-wide heatmaps, SLA breach alerts, staff utilization, system health).
* **#49**: Student Dashboard (My submitted reports, campus cleanliness leaderboard, quick-report CTA).
* **#50**: Teacher Dashboard (Department/faculty building status, priority reporting, verification queue).
* **#51**: Cleaning Staff Dashboard (Assigned task queue sorted by SLA deadline, shift schedule, completed history).
* **#52**: Issue Statistics Dashboard (Visual breakdown by category, building, and resolution time).
* **#53**: Real-Time Issue Counter, **#54**: Pending Issue Counter, **#55**: Resolved Issue Counter, **#56**: Overdue Issue Counter (Powered by Supabase Realtime subscriptions).
* **#57**: Dashboard Activity Summary (Live ticker of recent campus cleanliness actions).

### Module 5: Notification System (#58–#67)
* **#58**: Core Notification Engine (Postgres Trigger + Supabase Realtime + Edge Function email dispatcher).
* **#59**: Complaint Status Notification, **#60**: New Issue Notification, **#61**: Assignment Notification, **#62**: Resolution Notification.
* **#63**: Announcement Notification (Admin campus-wide broadcasts for scheduled maintenance or cleanliness drives).
* **#64**: Email Notification (Asynchronous transactional emails via Supabase Edge Functions + Resend/SMTP).
* **#65**: In-App Notification (Real-time toast via `supabase.channel('notifications')` + unread badge counter).
* **#66**: Notification History (Paginated inbox with mark-as-read / mark-all-read).
* **#67**: Notification Preferences (Granular user toggles per channel and event type; Emergency alerts cannot be muted by Staff/Admin).

### Module 6: Search, Filtering & Sorting (#68–#75)
* **#68**: Issue Search (Full-text search across `reference_number`, `description`, and location names using PostgreSQL `tsvector` and GIN index).
* **#69**: Advanced Issue Filtering (Combined multi-facet query builder via Supabase PostgREST / RPC).
* **#70**: Filter by Category, **#71**: Filter by Location, **#72**: Filter by Status, **#73**: Filter by Priority, **#74**: Filter by Date Range.
* **#75**: Sort Issues (Multi-column sorting by `created_at`, `sla_deadline`, `priority`, and `status`).

### Module 7: Analytics, Verification & Ratings (#76–#87)
* **#76**: Issue Analytics (Trend lines, MTTR - Mean Time To Resolution, hotspot identification).
* **#77**: Cleanliness Performance Report (Departmental and building-level SLA compliance analytics).
* **#78**: Resolved Issue Verification (Reporter or Admin inspects "After" proof photos to transition `RESOLVED` -> `VERIFIED`).
* **#79**: Student Satisfaction Rating & **#80**: Cleaning Staff Rating (1–5 star rating + structured tags upon resolution).
* **#81**: Issue Reopen Request (If resolution is unsatisfactory, reporter/Admin can reopen within 48 hours, incrementing `reopen_count` and escalating priority).
* **#82**: Admin Feedback Management (Moderation and review of low ratings and disputed resolutions).
* **#83**: Cleanliness Score (Quantitative 0–100 index per zone).
* **#84**: Area Cleanliness Ranking (Zone-by-zone comparative ranking).
* **#85**: Campus Cleanliness Leaderboard (Top-performing buildings/hostels/departments with anti-gaming rules).
* **#86**: Monthly Cleanliness Report (Automated 1st-of-month immutable snapshot with PDF and CSV export stored in Supabase Storage `monthly-reports` bucket).
* **#87**: System Activity Log (Append-only, tamper-evident audit trail with admin filter viewer).

## 3. SUPABASE DATABASE ARCHITECTURE (POSTGRESQL DDL & RLS SPECIFICATIONS)

```sql
-- Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- System Settings Table (Runtime Flags & Scoring Weights)
CREATE TABLE public.system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.system_settings (key, value) VALUES
('CAMPUS_TIMEZONE', '"Asia/Dhaka"'::jsonb),
('ENABLE_PUBLIC_LEADERBOARD', 'false'::jsonb),
('SCORING_WEIGHTS', '{"version": "v1.0", "w1": 2.0, "w2": 0.5, "w3": 4.0, "w4": 1.5}'::jsonb);

-- Core Geographic Hierarchy (#7, #23-#27)
CREATE TABLE public.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building VARCHAR(100) NOT NULL,
    floor VARCHAR(50) NOT NULL,
    room VARCHAR(50),
    specific_area VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    category VARCHAR(50) NOT NULL, -- 'WASHROOM', 'CLASSROOM', 'CORRIDOR', 'CANTEEN', 'HOSTEL', 'OUTDOOR'
    footfall_weight NUMERIC(3, 2) DEFAULT 1.00 CHECK (footfall_weight BETWEEN 0.50 AND 3.00),
    qr_code_hash VARCHAR(64) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users & RBAC linked to Supabase auth.users (#1-#2, #8-#17)
CREATE TYPE public.user_role AS ENUM ('STUDENT', 'TEACHER', 'STAFF', 'ADMIN');

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role public.user_role NOT NULL DEFAULT 'STUDENT',
    profile_photo_url TEXT,
    department VARCHAR(100),
    student_or_employee_id VARCHAR(50),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    notification_preferences JSONB DEFAULT '{"email": true, "in_app": true}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helper Function for RLS Role Checking
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Trigger to auto-create profile on Supabase Auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, is_verified)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'STUDENT'),
        NEW.email_confirmed_at IS NOT NULL
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Cleaning Staff Operational Profile (#43-#45, #47)
CREATE TABLE public.staff_profiles (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    shift_start TIME NOT NULL,
    shift_end TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    max_concurrent_tasks INT DEFAULT 3,
    assigned_department VARCHAR(100),
    assigned_building VARCHAR(100),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Issue Lifecycle & Work Orders (#3-#6, #18-#37)
CREATE TYPE public.issue_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY');
CREATE TYPE public.issue_status AS ENUM ('SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'VERIFIED', 'REOPENED', 'CANCELLED');

CREATE TABLE public.issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number VARCHAR(25) UNIQUE NOT NULL, -- CCMS-YYYYMMDD-XXXX
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    anonymous_fingerprint VARCHAR(64), -- Salted hash for rate-limiting & anti-gaming
    location_id UUID NOT NULL REFERENCES public.locations(id),
    category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    priority public.issue_priority DEFAULT 'MEDIUM',
    status public.issue_status DEFAULT 'SUBMITTED',
    photo_urls TEXT[] NOT NULL DEFAULT '{}',
    proof_photo_urls TEXT[] DEFAULT '{}',
    sla_deadline TIMESTAMPTZ NOT NULL,
    is_duplicate_of UUID REFERENCES public.issues(id),
    reopen_count INT DEFAULT 0,
    version INT DEFAULT 1, -- Optimistic locking
    search_vector TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(reference_number, '') || ' ' || coalesce(category, '') || ' ' || coalesce(description, ''))
    ) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_issues_search_vector ON public.issues USING GIN (search_vector);
CREATE INDEX idx_issues_location_created ON public.issues (location_id, created_at DESC);
CREATE INDEX idx_issues_status_priority ON public.issues (status, priority);

-- Issue Timeline History (#34, #35)
CREATE TABLE public.issue_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    old_status public.issue_status,
    new_status public.issue_status NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff Task Assignments (#38-#42, #46)
CREATE TABLE public.task_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES public.profiles(id),
    assigned_by UUID REFERENCES public.profiles(id), -- NULL if auto-assigned
    is_auto_assigned BOOLEAN DEFAULT FALSE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'ACTIVE', -- 'ACTIVE', 'COMPLETED', 'REASSIGNED'
    version INT DEFAULT 1
);

-- Verification & Quality Feedback (#78-#82)
CREATE TABLE public.issue_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID UNIQUE NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    verified_by UUID REFERENCES public.profiles(id),
    student_rating INT CHECK (student_rating BETWEEN 1 AND 5),
    staff_rating INT CHECK (staff_rating BETWEEN 1 AND 5),
    feedback_notes TEXT,
    is_flagged_for_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications (#58-#67)
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    entity_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics Pre-computed Nightly Snapshots (#83-#85)
CREATE TABLE public.zone_score_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    cleanliness_score NUMERIC(5, 2) NOT NULL CHECK (cleanliness_score BETWEEN 0.00 AND 100.00),
    open_issues_count INT NOT NULL,
    resolved_issues_count INT NOT NULL,
    sla_breach_rate NUMERIC(5, 4) NOT NULL,
    avg_rating NUMERIC(3, 2),
    formula_version VARCHAR(20) NOT NULL,
    metrics_breakdown JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(location_id, snapshot_date)
);

-- Monthly Immutable Reports (#86)
CREATE TABLE public.monthly_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_month VARCHAR(7) NOT NULL, -- YYYY-MM
    revision INT NOT NULL DEFAULT 1,
    campus_timezone VARCHAR(50) NOT NULL,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    summary_payload JSONB NOT NULL,
    pdf_storage_path TEXT,
    csv_storage_path TEXT,
    generated_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(report_month, revision)
);

-- Immutable System Activity Log (#87)
CREATE TABLE public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_id UUID,
    actor_role VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    state_before JSONB,
    state_after JSONB,
    ip_address INET,
    request_id UUID,
    is_security_critical BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enforce Append-Only Immutability on audit_logs
CREATE OR REPLACE FUNCTION public.prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'audit_logs table is strictly append-only. UPDATE and DELETE operations are prohibited.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lock_audit_logs
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_mutation();

-- Enable Row Level Security (RLS) on All Tables
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_score_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Enable Supabase Realtime on Operational & Notification Tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.issues;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```

## 4. CORE ALGORITHMS & SUPABASE RPC / EDGE FUNCTIONS

### 4.1. Cleanliness Scoring Engine (#83, #84, #85)
Implemented as a PostgreSQL stored procedure `public.compute_nightly_zone_scores()` scheduled via `pg_cron` at `00:00 UTC` daily (`SELECT cron.schedule('nightly-zone-scoring', '0 0 * * *', 'SELECT public.compute_nightly_zone_scores()');`). Evaluates each active location over a rolling 30-day window:

$$
\text{Raw Penalty} = (w_1 \cdot O_{\text{sev}}) + (w_2 \cdot B_{\text{sla}}) + (w_3 \cdot R_{\text{freq}}) - (w_4 \cdot F_{\text{rating}})
$$

$$
\text{Cleanliness Score} = \max\left(0, \min\left(100, 100 - \frac{\text{Raw Penalty}}{\text{Footfall Weight}}\right)\right)
$$

Where:
* $O_{\text{sev}}$: Sum of open issues weighted by severity ($\text{EMERGENCY}=10, \text{HIGH}=5, \text{MEDIUM}=2, \text{LOW}=1$).
* $B_{\text{sla}}$: Percentage of issues in the window that exceeded their `sla_deadline` ($0.0 \text{ to } 100.0$).
* $R_{\text{freq}}$: Recurrence count (issues reported in the same location & category within 72 hours of a previous resolution).
* $F_{\text{rating}}$: Average verification rating mapped to a bonus scale: $(\text{AvgRating} - 3.0) \times 5$.
* Default configurable weights stored in `public.system_settings`: $w_1 = 2.0, w_2 = 0.5, w_3 = 4.0, w_4 = 1.5$.

### 4.2. Automated Task Dispatch & Workload Balancing (#41, #44, #45)
Implemented as an atomic PostgreSQL RPC `public.auto_dispatch_issue(p_issue_id UUID)`:
1. Determine target `department` from `issue.category` and `location.building`.
2. Query `staff_profiles` where `is_available = TRUE`, current campus local time (`NOW() AT TIME ZONE 'Asia/Dhaka'`) is between `shift_start` and `shift_end`, and active tasks $< \text{max\_concurrent\_tasks}$.
3. Compute each candidate's current **Workload Index**:
   $$
   \text{Workload Index} = \sum_{i \in \text{ActiveTasks}} \text{PriorityWeight}(i)
   $$
4. Assign the task to the staff member with the lowest Workload Index using `FOR UPDATE SKIP LOCKED` / optimistic locking (`version`).
5. If no staff member qualifies, leave status as `SUBMITTED`, flag as `UNASSIGNED_ALERT`, and insert an urgent notification row for Admins into `public.notifications`.

### 4.3. Anti-Gaming & Duplicate Detection (#31, #85)
1. **Spatial-Temporal Deduplication**: Before inserting an issue for `(location_id, category)`, execute RPC `public.check_duplicate_issue(p_location_id, p_category)` checking unresolved issues created within the last 6 hours. If found, return a `409 Duplicate Candidate` response so the user can either subscribe to the existing issue or explicitly confirm a distinct issue.
2. **Leaderboard Anti-Gaming**:
   * Cancelled or duplicate issues are excluded from all scoring calculations.
   * Rate-limit users (or `anonymous_fingerprint`) to a maximum of 5 reports per hour and 15 per day.

## 5. SUPABASE-NATIVE CLEAN ARCHITECTURE DIRECTORY STRUCTURE

```text
├── supabase/
│   ├── config.toml               # Local Supabase CLI configuration
│   ├── migrations/               # Sequential SQL migrations (DDL, RLS policies, Triggers, RPCs, pg_cron)
│   ├── functions/                # Supabase Edge Functions (Deno/TypeScript)
│   │   ├── dispatch-email/       # Transactional Email Notifications (#64)
│   │   └── monthly-report/       # PDF/CSV Monthly Report Generator (#86)
│   └── seed.sql                  # Campus buildings, rooms, categories, and initial test roles
├── src/
│   ├── config/                   # Supabase client initializers (Browser Client, Server/Service Client)
│   ├── core/
│   │   ├── domain/               # Pure entities, value objects, state machine transitions
│   │   ├── interfaces/           # Repository ports, storage interfaces, notification contracts
│   │   └── usecases/             # Application business workflows (grouped by the 7 modules)
│   ├── infrastructure/
│   │   ├── supabase/             # Supabase Repositories, RPC wrappers, Storage bucket adapters
│   │   ├── realtime/             # Supabase Realtime channel subscribers (Counters & In-App Alerts)
│   │   └── audit/                # Cross-cutting AuditLoggingService (#87)
│   ├── presentation/
│   │   ├── api/                  # Backend API routes / Server Actions, RBAC & Rate-Limit middlewares
│   │   └── validators/           # Zod strict request schema validation
│   └── web/                      # Role-based Frontend UI (Student, Teacher, Staff, Admin)
```

## 6. PHASED DELIVERY MILESTONES

Execute the build systematically across 7 sequential milestones:

* **Milestone 1: Supabase Foundation, Auth, RLS & Immutable Audit Log** (Issues #1–#2, #8–#17, #87)
  * Supabase CLI setup (`supabase/config.toml`), full SQL migrations for tables, RLS policies, `on_auth_user_created` trigger, `audit_logs` immutability trigger, Supabase Storage buckets (`avatars`, `issue-photos`, `proof-photos`, `monthly-reports`), and Profile Management.
* **Milestone 2: Spatial Registry & Issue Intake Engine** (Issues #3–#7, #18–#37)
  * Building/Floor/Room/Area hierarchy, QR code generator, multi-photo upload pipeline to `issue-photos` bucket, duplicate detection RPC, reference number generation, and state machine.
* **Milestone 3: Staff Operations & Automated Dispatch** (Issues #38–#47)
  * Staff profiles, shift availability, workload calculator, `auto_dispatch_issue` RPC, manual task assignment, and mobile-friendly Staff Task resolution flow with `proof-photos` upload.
* **Milestone 4: Real-Time Dashboards & Notification Hub** (Issues #48–#67)
  * Role-specific dashboards (Admin, Student, Teacher, Staff), Supabase Realtime live counters, in-app toast + `dispatch-email` Edge Function, and user notification preferences.
* **Milestone 5: Search, Filtering & Sorting Engine** (Issues #68–#75)
  * Full-text `tsvector` search, multi-parameter filtering (category, location, status, priority, date), and dynamic sorting.
* **Milestone 6: Verification, Ratings & Reopen Loop** (Issues #78–#82)
  * Resolution proof verification, student/staff 1–5 star ratings, issue reopen requests, and admin feedback moderation.
* **Milestone 7: Analytics, Cleanliness Scoring, Leaderboard & Monthly Reports** (Issues #76–#77, #83–#86)
  * `pg_cron` nightly snapshot function (`compute_nightly_zone_scores`), Cleanliness Score & Ranking API, Campus Leaderboard, idempotent Monthly Report generator (PDF/CSV to `monthly-reports` bucket), and Audit Log archival worker.

## 7. IMMEDIATE EXECUTION DIRECTIVE (START HERE)

Do not ask introductory questions. Begin **Milestone 1** immediately:

1. Initialize the project structure and `supabase/config.toml`.
2. Create the initial Supabase migration files (`supabase/migrations/00001_initial_schema.sql` and `00002_rls_and_storage_policies.sql`) containing the complete PostgreSQL DDL, `auth.users` triggers, Storage buckets, RLS policies, and `audit_logs` immutability triggers defined in Section 3.
3. Implement the Supabase client layers (`anon` and `service_role`), the cross-cutting `AuditLogService` (#87), and the `Auth & Profile Module` (#1–#2, #8–#17).
4. Provide a clear verification checklist at the end of Milestone 1 before proceeding to Milestone 2.