-- ==============================================================================
-- CCMS: Synchronize auth.users into public.profiles & Install Auto-Sync Trigger
-- Fixes: "insert or update on table 'issues' violates foreign key constraint 'issues_reporter_id_fkey'"
-- ==============================================================================

-- 1. Ensure public.user_role ENUM exists
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('STUDENT', 'TEACHER', 'STAFF', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Ensure public.profiles table exists with proper columns and constraints
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

-- 3. Synchronize all existing auth.users into public.profiles
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    department,
    student_or_employee_id,
    is_verified,
    is_active
)
SELECT 
    u.id,
    COALESCE(u.email, u.id || '@baust.edu.bd'),
    COALESCE(
        u.raw_user_meta_data->>'full_name', 
        split_part(u.email, '@', 1), 
        'Campus Member'
    ),
    COALESCE(
        (u.raw_user_meta_data->>'role')::public.user_role, 
        CASE 
            WHEN u.email ILIKE '%admin%' THEN 'ADMIN'::public.user_role
            WHEN u.email ILIKE '%staff%' THEN 'STAFF'::public.user_role
            WHEN u.email ILIKE '%teacher%' OR u.email ILIKE '%.faculty%' THEN 'TEACHER'::public.user_role
            ELSE 'STUDENT'::public.user_role
        END
    ),
    u.raw_user_meta_data->>'department',
    u.raw_user_meta_data->>'student_or_employee_id',
    TRUE,
    TRUE
FROM auth.users u
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    is_verified = TRUE,
    is_active = TRUE,
    updated_at = NOW();

-- 4. Recreate trigger function to guarantee all future Auth sign-ups populate public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id, 
        email, 
        full_name, 
        role, 
        department, 
        student_or_employee_id, 
        is_verified,
        is_active
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.email, NEW.id || '@baust.edu.bd'),
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'Campus Member'),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'STUDENT'::public.user_role),
        NEW.raw_user_meta_data->>'department',
        NEW.raw_user_meta_data->>'student_or_employee_id',
        NEW.email_confirmed_at IS NOT NULL,
        TRUE
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

-- 5. Attach trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Verification query: Count profiles vs auth.users
SELECT 
    (SELECT COUNT(*) FROM auth.users) AS total_auth_users,
    (SELECT COUNT(*) FROM public.profiles) AS total_profiles;

