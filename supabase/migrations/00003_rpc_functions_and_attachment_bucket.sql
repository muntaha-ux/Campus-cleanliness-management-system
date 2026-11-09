-- ==============================================================================
-- Migration: 00003_rpc_functions_and_attachment_bucket.sql
-- Description: Concurrency-Safe RPCs (Task Assignment, Duplicate Check, Auto-Dispatch)
--              and 'issue-attachments' Storage Bucket
-- Project: Campus Cleanliness Management System
-- ==============================================================================

-- 1. Create 'issue-attachments' Storage Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
('issue-attachments', 'issue-attachments', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage Policies for 'issue-attachments'
DROP POLICY IF EXISTS "Public issue attachments are viewable by anyone" ON storage.objects;
CREATE POLICY "Public issue attachments are viewable by anyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'issue-attachments');

DROP POLICY IF EXISTS "Authenticated users can upload issue attachments" ON storage.objects;
CREATE POLICY "Authenticated users can upload issue attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'issue-attachments');

-- 2. Duplicate Check Function (#31)
-- Checks for unresolved reports at the same location & category within 6 hours
CREATE OR REPLACE FUNCTION public.check_duplicate_issue(
    p_location_id UUID,
    p_category VARCHAR
)
RETURNS TABLE (
    id UUID,
    reference_number VARCHAR,
    category VARCHAR,
    description TEXT,
    priority public.issue_priority,
    status public.issue_status,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.reference_number,
        i.category,
        i.description,
        i.priority,
        i.status,
        i.created_at
    FROM public.issues i
    WHERE i.location_id = p_location_id
      AND i.category = p_category
      AND i.status NOT IN ('RESOLVED', 'VERIFIED', 'CANCELLED')
      AND i.created_at >= (NOW() - INTERVAL '6 hours')
    ORDER BY i.created_at DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 3. Concurrency-Safe Task Assignment RPC (#38, #39, #42)
-- Uses FOR UPDATE SKIP LOCKED to prevent two managers assigning concurrently
CREATE OR REPLACE FUNCTION public.assign_issue_to_staff(
    p_issue_id UUID,
    p_staff_id UUID,
    p_assigned_by UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_issue RECORD;
    v_staff RECORD;
    v_assigned_by UUID;
    v_assignment_id UUID;
    v_old_status public.issue_status;
BEGIN
    -- Determine assigner
    v_assigned_by := COALESCE(p_assigned_by, auth.uid());

    -- 1. Lock issue row with FOR UPDATE
    SELECT * INTO v_issue
    FROM public.issues
    WHERE id = p_issue_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Issue with ID % not found.', p_issue_id;
    END IF;

    IF v_issue.status IN ('RESOLVED', 'VERIFIED', 'CANCELLED') THEN
        RAISE EXCEPTION 'Cannot assign an issue in terminal status %.', v_issue.status;
    END IF;

    -- 2. Verify target staff member exists and is in STAFF role
    SELECT p.*, s.is_available, s.max_concurrent_tasks 
    INTO v_staff
    FROM public.profiles p
    LEFT JOIN public.staff_profiles s ON s.user_id = p.id
    WHERE p.id = p_staff_id;

    IF NOT FOUND OR v_staff.role NOT IN ('STAFF', 'ADMIN') THEN
        RAISE EXCEPTION 'Target user % is not authorized staff.', p_staff_id;
    END IF;

    v_old_status := v_issue.status;

    -- 3. Mark previous active assignments for this issue as REASSIGNED
    UPDATE public.task_assignments
    SET status = 'REASSIGNED'
    WHERE issue_id = p_issue_id AND status = 'ACTIVE';

    -- 4. Create new task assignment
    INSERT INTO public.task_assignments (
        issue_id,
        staff_id,
        assigned_by,
        is_auto_assigned,
        status,
        version
    ) VALUES (
        p_issue_id,
        p_staff_id,
        v_assigned_by,
        (v_assigned_by IS NULL),
        'ACTIVE',
        1
    ) RETURNING id INTO v_assignment_id;

    -- 5. Transition issue status to ASSIGNED and bump version
    UPDATE public.issues
    SET 
        status = 'ASSIGNED',
        version = version + 1,
        updated_at = NOW()
    WHERE id = p_issue_id;

    -- 6. Record timeline history (#35)
    INSERT INTO public.issue_history (
        issue_id,
        actor_id,
        old_status,
        new_status,
        comment
    ) VALUES (
        p_issue_id,
        v_assigned_by,
        v_old_status,
        'ASSIGNED',
        'Assigned to cleaning staff member: ' || v_staff.full_name
    );

    -- 7. Dispatch in-app notification to the assigned staff member (#61, #65)
    INSERT INTO public.notifications (
        recipient_id,
        type,
        title,
        message,
        entity_id
    ) VALUES (
        p_staff_id,
        'TASK_ASSIGNED',
        'New Cleanliness Task Assigned',
        'You have been assigned to task ' || v_issue.reference_number || ' (' || v_issue.category || ').',
        p_issue_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'assignment_id', v_assignment_id,
        'issue_id', p_issue_id,
        'staff_id', p_staff_id,
        'status', 'ASSIGNED'
    );
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

-- 4. Automated Task Dispatch RPC (#41, #44, #45)
CREATE OR REPLACE FUNCTION public.auto_dispatch_issue(
    p_issue_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_issue RECORD;
    v_location RECORD;
    v_candidate_id UUID;
BEGIN
    SELECT * INTO v_issue FROM public.issues WHERE id = p_issue_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'reason', 'Issue not found');
    END IF;

    SELECT * INTO v_location FROM public.locations WHERE id = v_issue.location_id;

    -- Query staff on shift, available, with lowest active workload
    SELECT sp.user_id INTO v_candidate_id
    FROM public.staff_profiles sp
    JOIN public.profiles p ON p.id = sp.user_id
    WHERE sp.is_available = TRUE
      AND p.is_active = TRUE
      AND (sp.assigned_building IS NULL OR sp.assigned_building = v_location.building)
    ORDER BY (
        SELECT COUNT(*) 
        FROM public.task_assignments ta 
        WHERE ta.staff_id = sp.user_id AND ta.status = 'ACTIVE'
    ) ASC
    LIMIT 1;

    IF v_candidate_id IS NOT NULL THEN
        RETURN public.assign_issue_to_staff(p_issue_id, v_candidate_id, NULL);
    ELSE
        -- Flag as UNASSIGNED alert and notify admins
        INSERT INTO public.notifications (
            recipient_id,
            type,
            title,
            message,
            entity_id
        )
        SELECT 
            p.id,
            'UNASSIGNED_ALERT',
            'Urgent: Unassigned Issue ' || v_issue.reference_number,
            'No staff currently available for ' || v_issue.priority || ' priority issue at ' || COALESCE(v_location.building, 'Campus'),
            p_issue_id
        FROM public.profiles p
        WHERE p.role = 'ADMIN';

        RETURN jsonb_build_object('success', false, 'reason', 'No available staff member');
    END IF;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

