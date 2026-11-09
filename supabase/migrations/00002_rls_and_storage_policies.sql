-- ==============================================================================
-- Migration: 00002_rls_and_storage_policies.sql
-- Description: Row Level Security (RLS) & Storage Bucket Isolation Policies
-- Project: Campus Cleanliness Management System
-- ==============================================================================

-- 1. Enable RLS on All Tables
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

-- 2. System Settings RLS
DROP POLICY IF EXISTS "Anyone can read system settings" ON public.system_settings;
CREATE POLICY "Anyone can read system settings"
ON public.system_settings FOR SELECT
TO authenticated, anon
USING (true);

DROP POLICY IF EXISTS "Admins can manage system settings" ON public.system_settings;
CREATE POLICY "Admins can manage system settings"
ON public.system_settings FOR ALL
TO authenticated
USING (public.get_my_role() = 'ADMIN')
WITH CHECK (public.get_my_role() = 'ADMIN');

-- 3. Locations RLS
DROP POLICY IF EXISTS "Anyone can view active locations" ON public.locations;
CREATE POLICY "Anyone can view active locations"
ON public.locations FOR SELECT
TO authenticated, anon
USING (is_active = TRUE OR public.get_my_role() = 'ADMIN');

DROP POLICY IF EXISTS "Admins can modify locations" ON public.locations;
CREATE POLICY "Admins can modify locations"
ON public.locations FOR ALL
TO authenticated
USING (public.get_my_role() = 'ADMIN')
WITH CHECK (public.get_my_role() = 'ADMIN');

-- 4. Profiles RLS (#1-#2, #8-#17)
DROP POLICY IF EXISTS "Users can view profile directory" ON public.profiles;
CREATE POLICY "Users can view profile directory"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can update own non-privileged profile data" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id OR public.get_my_role() = 'ADMIN')
WITH CHECK (
    public.get_my_role() = 'ADMIN' 
    OR (
        auth.uid() = id
        -- Regular users cannot self-escalate role, change verified status, or unban themselves
        AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
        AND is_verified = (SELECT p.is_verified FROM public.profiles p WHERE p.id = auth.uid())
        AND is_active = (SELECT p.is_active FROM public.profiles p WHERE p.id = auth.uid())
    )
);

DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id OR public.get_my_role() = 'ADMIN');

-- 5. Staff Profiles RLS (#43-#45)
DROP POLICY IF EXISTS "Authenticated users can view staff profiles" ON public.staff_profiles;
CREATE POLICY "Authenticated users can view staff profiles"
ON public.staff_profiles FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Staff can update own availability" ON public.staff_profiles;
CREATE POLICY "Staff can update own availability"
ON public.staff_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR public.get_my_role() = 'ADMIN')
WITH CHECK (
    public.get_my_role() = 'ADMIN'
    OR auth.uid() = user_id
);

DROP POLICY IF EXISTS "Admins can manage staff profiles" ON public.staff_profiles;
CREATE POLICY "Admins can manage staff profiles"
ON public.staff_profiles FOR ALL
TO authenticated
USING (public.get_my_role() = 'ADMIN')
WITH CHECK (public.get_my_role() = 'ADMIN');

-- 6. Issues RLS (#3-#7, #18-#37)
DROP POLICY IF EXISTS "Authenticated users can view issues" ON public.issues;
CREATE POLICY "Authenticated users can view issues"
ON public.issues FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can report issues" ON public.issues;
CREATE POLICY "Authenticated users can report issues"
ON public.issues FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = reporter_id 
    OR is_anonymous = TRUE
    OR public.get_my_role() = 'ADMIN'
);

DROP POLICY IF EXISTS "Reporters can edit submitted issues and staff/admin can update lifecycle" ON public.issues;
CREATE POLICY "Issues update policy"
ON public.issues FOR UPDATE
TO authenticated
USING (
    public.get_my_role() = 'ADMIN'
    OR public.get_my_role() = 'STAFF'
    OR (auth.uid() = reporter_id AND status = 'SUBMITTED')
)
WITH CHECK (
    public.get_my_role() = 'ADMIN'
    OR public.get_my_role() = 'STAFF'
    OR (auth.uid() = reporter_id AND status = 'SUBMITTED')
);

DROP POLICY IF EXISTS "Admins can delete issues" ON public.issues;
CREATE POLICY "Admins can delete issues"
ON public.issues FOR DELETE
TO authenticated
USING (public.get_my_role() = 'ADMIN');

-- 7. Issue History RLS (#34, #35)
DROP POLICY IF EXISTS "Authenticated users can view issue history" ON public.issue_history;
CREATE POLICY "Authenticated users can view issue history"
ON public.issue_history FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can log issue history" ON public.issue_history;
CREATE POLICY "Authenticated users can log issue history"
ON public.issue_history FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = actor_id OR public.get_my_role() = 'ADMIN');

-- 8. Task Assignments RLS (#38-#42, #46)
DROP POLICY IF EXISTS "Staff and Admins can view task assignments" ON public.task_assignments;
CREATE POLICY "Staff and Admins can view task assignments"
ON public.task_assignments FOR SELECT
TO authenticated
USING (
    staff_id = auth.uid() 
    OR public.get_my_role() = 'ADMIN'
);

DROP POLICY IF EXISTS "Admins can assign tasks" ON public.task_assignments;
CREATE POLICY "Admins can assign tasks"
ON public.task_assignments FOR INSERT
TO authenticated
WITH CHECK (public.get_my_role() = 'ADMIN');

DROP POLICY IF EXISTS "Staff and Admins can update task status" ON public.task_assignments;
CREATE POLICY "Staff and Admins can update task status"
ON public.task_assignments FOR UPDATE
TO authenticated
USING (
    staff_id = auth.uid() 
    OR public.get_my_role() = 'ADMIN'
)
WITH CHECK (
    staff_id = auth.uid() 
    OR public.get_my_role() = 'ADMIN'
);

-- 9. Issue Verifications RLS (#78-#82)
DROP POLICY IF EXISTS "Anyone authenticated can view verifications" ON public.issue_verifications;
CREATE POLICY "Anyone authenticated can view verifications"
ON public.issue_verifications FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Reporters and Admins can verify resolved issues" ON public.issue_verifications;
CREATE POLICY "Reporters and Admins can verify resolved issues"
ON public.issue_verifications FOR INSERT
TO authenticated
WITH CHECK (
    public.get_my_role() = 'ADMIN'
    OR verified_by = auth.uid()
);

-- 10. Notifications RLS (#58-#67)
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "Users can mark own notifications as read" ON public.notifications;
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
ON public.notifications FOR DELETE
TO authenticated
USING (recipient_id = auth.uid());

-- 11. Snapshots & Reports RLS (#83-#86)
DROP POLICY IF EXISTS "Authenticated users can view zone scores" ON public.zone_score_snapshots;
CREATE POLICY "Authenticated users can view zone scores"
ON public.zone_score_snapshots FOR SELECT
TO authenticated, anon
USING (true);

DROP POLICY IF EXISTS "Authenticated users can view monthly reports" ON public.monthly_reports;
CREATE POLICY "Authenticated users can view monthly reports"
ON public.monthly_reports FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admins can manage monthly reports" ON public.monthly_reports;
CREATE POLICY "Admins can manage monthly reports"
ON public.monthly_reports FOR ALL
TO authenticated
USING (public.get_my_role() = 'ADMIN')
WITH CHECK (public.get_my_role() = 'ADMIN');

-- 12. Audit Logs RLS (#87, ADR 005)
DROP POLICY IF EXISTS "Only Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Only Admins can view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.get_my_role() = 'ADMIN');

DROP POLICY IF EXISTS "Authenticated and service users can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated and service users can insert audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Revoke mutation rights explicitly on public.audit_logs
REVOKE UPDATE, DELETE ON public.audit_logs FROM authenticated, anon;

-- 13. Supabase Storage Buckets Setup & Isolation Policies
-- Buckets: avatars, issue-photos, proof-photos, monthly-reports
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
('issue-photos', 'issue-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
('proof-photos', 'proof-photos', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
('monthly-reports', 'monthly-reports', false, 52428800, ARRAY['application/pdf', 'text/csv'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage Policies for 'avatars'
DROP POLICY IF EXISTS "Public avatars can be viewed by anyone" ON storage.objects;
CREATE POLICY "Public avatars can be viewed by anyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage Policies for 'issue-photos'
DROP POLICY IF EXISTS "Anyone can view issue photos" ON storage.objects;
CREATE POLICY "Anyone can view issue photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'issue-photos');

DROP POLICY IF EXISTS "Authenticated users can upload issue photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload issue photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'issue-photos');

-- Storage Policies for 'proof-photos'
DROP POLICY IF EXISTS "Authenticated users can view proof photos" ON storage.objects;
CREATE POLICY "Authenticated users can view proof photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'proof-photos');

DROP POLICY IF EXISTS "Staff and Admin can upload proof photos" ON storage.objects;
CREATE POLICY "Staff and Admin can upload proof photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'proof-photos' 
    AND public.get_my_role() IN ('STAFF', 'ADMIN')
);

-- Storage Policies for 'monthly-reports'
DROP POLICY IF EXISTS "Authenticated users can view monthly reports files" ON storage.objects;
CREATE POLICY "Authenticated users can view monthly reports files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'monthly-reports');

DROP POLICY IF EXISTS "Only Admins can upload monthly reports" ON storage.objects;
CREATE POLICY "Only Admins can upload monthly reports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'monthly-reports' 
    AND public.get_my_role() = 'ADMIN'
);

