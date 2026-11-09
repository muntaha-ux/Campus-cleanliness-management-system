-- ==============================================================================
-- Migration: 00001_initial_schema.sql
-- Description: Core Schema, Extensions, Enums, Tables, Triggers & Realtime
-- Project: Campus Cleanliness Management System
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. System Settings Table (Runtime Flags & Scoring Weights)
CREATE TABLE IF NOT EXISTS public.system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Initial System Settings if not already present
INSERT INTO public.system_settings (key, value) VALUES
('CAMPUS_TIMEZONE', '"Asia/Dhaka"'::jsonb),
('ENABLE_PUBLIC_LEADERBOARD', 'false'::jsonb),
('SCORING_WEIGHTS', '{"version": "v1.0", "w1": 2.0, "w2": 0.5, "w3": 4.0, "w4": 1.5}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 3. Core Geographic Hierarchy (#7, #23-#27)
CREATE TABLE IF NOT EXISTS public.locations (
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

CREATE INDEX IF NOT EXISTS idx_locations_building ON public.locations(building);
CREATE INDEX IF NOT EXISTS idx_locations_qr_code_hash ON public.locations(qr_code_hash);

-- 4. Users & RBAC linked to Supabase auth.users (#1-#2, #8-#17)
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('STUDENT', 'TEACHER', 'STAFF', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
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

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON public.profiles(department);

-- Helper Function for RLS Role Checking
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Trigger to auto-create profile on Supabase Auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, department, student_or_employee_id, is_verified)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'STUDENT'),
        NEW.raw_user_meta_data->>'department',
        NEW.raw_user_meta_data->>'student_or_employee_id',
        NEW.email_confirmed_at IS NOT NULL
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        is_verified = EXCLUDED.is_verified,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Cleaning Staff Operational Profile (#43-#45, #47)
CREATE TABLE IF NOT EXISTS public.staff_profiles (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    shift_start TIME NOT NULL,
    shift_end TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    max_concurrent_tasks INT DEFAULT 3,
    assigned_department VARCHAR(100),
    assigned_building VARCHAR(100),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Issue Lifecycle & Work Orders (#3-#6, #18-#37)
DO $$ BEGIN
    CREATE TYPE public.issue_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.issue_status AS ENUM ('SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'VERIFIED', 'REOPENED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.issues (
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

CREATE INDEX IF NOT EXISTS idx_issues_search_vector ON public.issues USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_issues_location_created ON public.issues (location_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issues_status_priority ON public.issues (status, priority);
CREATE INDEX IF NOT EXISTS idx_issues_reporter ON public.issues (reporter_id);

-- 7. Issue Timeline History (#34, #35)
CREATE TABLE IF NOT EXISTS public.issue_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    old_status public.issue_status,
    new_status public.issue_status NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_issue_history_issue_id ON public.issue_history(issue_id, created_at DESC);

-- 8. Staff Task Assignments (#38-#42, #46)
CREATE TABLE IF NOT EXISTS public.task_assignments (
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

CREATE INDEX IF NOT EXISTS idx_task_assignments_staff ON public.task_assignments(staff_id, status);
CREATE INDEX IF NOT EXISTS idx_task_assignments_issue ON public.task_assignments(issue_id);

-- 9. Verification & Quality Feedback (#78-#82)
CREATE TABLE IF NOT EXISTS public.issue_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID UNIQUE NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    verified_by UUID REFERENCES public.profiles(id),
    student_rating INT CHECK (student_rating BETWEEN 1 AND 5),
    staff_rating INT CHECK (staff_rating BETWEEN 1 AND 5),
    feedback_notes TEXT,
    is_flagged_for_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Notifications (#58-#67)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    entity_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id, is_read, created_at DESC);

-- 11. Analytics Pre-computed Nightly Snapshots (#83-#85)
CREATE TABLE IF NOT EXISTS public.zone_score_snapshots (
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

CREATE INDEX IF NOT EXISTS idx_zone_score_snapshots_date ON public.zone_score_snapshots(snapshot_date DESC);

-- 12. Monthly Immutable Reports (#86)
CREATE TABLE IF NOT EXISTS public.monthly_reports (
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

-- 13. Immutable System Activity Log (#87)
CREATE TABLE IF NOT EXISTS public.audit_logs (
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

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 14. Enforce Append-Only Immutability on audit_logs (#87, ADR 005)
CREATE OR REPLACE FUNCTION public.prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'audit_logs table is strictly append-only. UPDATE and DELETE operations are prohibited.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lock_audit_logs ON public.audit_logs;
CREATE TRIGGER trg_lock_audit_logs
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_mutation();

-- 15. Enable Supabase Realtime on Operational & Notification Tables
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.issues;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.task_assignments;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
