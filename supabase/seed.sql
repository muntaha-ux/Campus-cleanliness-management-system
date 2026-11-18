-- ==============================================================================
-- Seed: seed.sql
-- Description: Authentic BAUST Saidpur Cantonment Geographic & Facility Registry,
--              Mock Stakeholder Accounts (Admin, Staff, Teacher, Student),
--              and Initial Operational Work Orders
-- Project: Campus Cleanliness Management System — BAUST Edition
-- Location: Bangladesh Army University of Science and Technology (BAUST), Saidpur
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. BAUST LOCATIONS & FACILITY REGISTRY
-- ==============================================================================
INSERT INTO public.locations (id, building, floor, room, specific_area, department, category, footfall_weight, qr_code_hash)
VALUES
-- 1. Administration Building
('10000000-0000-0000-0000-000000000001', 'Administration Building', 'Ground Floor', 'Lobby & Reception', 'Main Entrance Foyer & Visitors Lounge', 'Administration', 'CORRIDOR', 2.00, 'loc_baust_admin_g_foyer'),
('10000000-0000-0000-0000-000000000002', 'Administration Building', '1st Floor', 'Registrar Office', 'Executive Corridor & Staff Washrooms', 'Registrar', 'WASHROOM', 1.50, 'loc_baust_admin_1_reg'),
('10000000-0000-0000-0000-000000000003', 'Administration Building', '2nd Floor', 'VC Secretariat', 'Conference Room & VIP Restroom', 'Executive', 'WASHROOM', 1.20, 'loc_baust_admin_2_vc'),

-- 2. Academic Building 1 (ECE Faculty: CSE, EEE, ICT)
('10000000-0000-0000-0000-000000000010', 'Academic Building 1 (ECE)', 'Ground Floor', 'Washroom Block G', 'Male Student Washroom near Main Staircase', 'CSE', 'WASHROOM', 2.50, 'loc_baust_ab1_g_w_male'),
('10000000-0000-0000-0000-000000000011', 'Academic Building 1 (ECE)', '1st Floor', 'Software Lab 102', 'CSE Programming & AI Research Lab', 'CSE', 'CLASSROOM', 1.80, 'loc_baust_ab1_1_cse_lab1'),
('10000000-0000-0000-0000-000000000012', 'Academic Building 1 (ECE)', '2nd Floor', 'Lecture Gallery 201', 'Tiered Amphitheater Lecture Hall', 'EEE', 'CLASSROOM', 2.20, 'loc_baust_ab1_2_gallery201'),
('10000000-0000-0000-0000-000000000013', 'Academic Building 1 (ECE)', '2nd Floor', 'Washroom Block 2F', 'Female Restroom Cluster', 'EEE', 'WASHROOM', 2.40, 'loc_baust_ab1_2_w_female'),
('10000000-0000-0000-0000-000000000014', 'Academic Building 1 (ECE)', '3rd Floor', 'EEE Power Lab', 'High-Voltage Machinery & Circuit Testing', 'EEE', 'CLASSROOM', 1.40, 'loc_baust_ab1_3_eee_power'),

-- 3. Academic Building 2 (ME, IPE, Civil Engineering)
('10000000-0000-0000-0000-000000000020', 'Academic Building 2 (ME & CE)', 'Ground Floor', 'Heavy Machinery Workshop', 'Lathe Machine & Welding Station Floor', 'ME', 'CORRIDOR', 2.20, 'loc_baust_ab2_g_workshop'),
('10000000-0000-0000-0000-000000000021', 'Academic Building 2 (ME & CE)', '1st Floor', 'Fluid Mechanics Lab', 'Hydraulics Testing Bench & Sink Drain', 'CE', 'CLASSROOM', 1.60, 'loc_baust_ab2_1_ce_fluid'),
('10000000-0000-0000-0000-000000000022', 'Academic Building 2 (ME & CE)', '2nd Floor', 'Drawing Studio 205', 'Civil Engineering Drafting & Design Studio', 'CE', 'CLASSROOM', 1.50, 'loc_baust_ab2_2_ce_draft'),
('10000000-0000-0000-0000-000000000023', 'Academic Building 2 (ME & CE)', '3rd Floor', 'Corridor Central', 'Trash Bin Station Near East Lift', 'Janitorial', 'CORRIDOR', 1.80, 'loc_baust_ab2_3_corr_bin'),

-- 4. Faculty of Business Studies & Humanities Building
('10000000-0000-0000-0000-000000000030', 'Business Studies & Humanities', 'Ground Floor', 'Seminar Hall BBA', 'Executive MBA & DBA Presentation Room', 'DBA', 'CLASSROOM', 1.50, 'loc_baust_bsh_g_seminar'),
('10000000-0000-0000-0000-000000000031', 'Business Studies & Humanities', '1st Floor', 'English Language Lab', 'Digital Audio-Visual Booths & Desks', 'English', 'CLASSROOM', 1.30, 'loc_baust_bsh_1_lang_lab'),

-- 5. Central Library & Auditorium Complex
('10000000-0000-0000-0000-000000000040', 'Central Library & Auditorium', 'Ground Floor', 'Main Reading Hall', 'Silent Study Tables & Bookstacks Aisle', 'Library', 'CLASSROOM', 2.60, 'loc_baust_lib_g_reading'),
('10000000-0000-0000-0000-000000000041', 'Central Library & Auditorium', '1st Floor', 'Auditorium Main Seating', '500-Seat Hall & Stage Front Rows', 'Facilities', 'CORRIDOR', 2.80, 'loc_baust_aud_1_seating'),

-- 6. Residential Halls
('10000000-0000-0000-0000-000000000050', 'Abbasuddin Ahmed Hall (Male)', 'Ground Floor', 'Dining Mess Hall', 'Student Dining Tables & Handwash Basin', 'Hostel', 'HOSTEL', 2.80, 'loc_baust_aah_g_mess'),
('10000000-0000-0000-0000-000000000051', 'Abbasuddin Ahmed Hall (Male)', '2nd Floor', 'Block B Corridor', 'Corridor Common Washroom & Showers', 'Hostel', 'WASHROOM', 2.50, 'loc_baust_aah_2_w_block'),
('10000000-0000-0000-0000-000000000060', 'Bir Protik Taramon Bibi Hall (Female)', 'Ground Floor', 'Dining Mess & Kitchen', 'Dining Area & Tray Disposal Unit', 'Hostel', 'HOSTEL', 2.70, 'loc_baust_tbh_g_dining'),
('10000000-0000-0000-0000-000000000061', 'Bir Protik Taramon Bibi Hall (Female)', '1st Floor', 'Common Study Lounge', 'Shared Study Desks & Balcony Area', 'Hostel', 'HOSTEL', 1.70, 'loc_baust_tbh_1_lounge'),

-- 7. Common Campus Amenities
('10000000-0000-0000-0000-000000000070', 'BAUST Central Cafeteria', 'Ground Floor', 'Main Food Court', 'Student & Faculty Dining Floor & Counter', 'Canteen', 'CANTEEN', 3.00, 'loc_baust_cafe_g_main'),
('10000000-0000-0000-0000-000000000071', 'Central Mosque & Complex', 'Ground Floor', 'Ablution Area (Wudu Khana)', 'Water Taps, Drainage Sump & Entrance Floor', 'Grounds', 'WASHROOM', 2.30, 'loc_baust_mosque_wudu')
ON CONFLICT (qr_code_hash) DO NOTHING;

-- ==============================================================================
-- 2. AUTH USERS (Password for all accounts: Password123!)
-- ==============================================================================
-- Standard bcrypt hash for 'Password123!'
-- $2a$10$v0vI4l9wM1mJ9hPZg6yvAOiU9zSgG/09L8ZqB7fU5xK8.6N9WjMGe

INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
VALUES
-- 1. ADMIN USER
(
  'a0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@baust.edu.bd',
  crypt('Password123!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Col. Md. Zahid Hossain (Retd)","role":"ADMIN","department":"Estate Office","student_or_employee_id":"ADM-BAUST-001"}'::jsonb,
  NOW(),
  NOW()
),

-- 2. STAFF / CLEANER USERS
(
  'c0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'staff.rafiqul@baust.edu.bd',
  crypt('Password123!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Md. Rafiqul Islam","role":"STAFF","department":"Campus Sanitation","student_or_employee_id":"STF-CLN-001"}'::jsonb,
  NOW(),
  NOW()
),
(
  'c0000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'staff.morjina@baust.edu.bd',
  crypt('Password123!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Mst. Morjina Begum","role":"STAFF","department":"Campus Sanitation","student_or_employee_id":"STF-CLN-002"}'::jsonb,
  NOW(),
  NOW()
),

-- 3. TEACHER / SUPERVISOR USERS (Rakib Trofder, Sirajul Islam)
(
  'b0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'rakib.trofder@baust.edu.bd',
  crypt('Password123!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Rakib Trofder","role":"TEACHER","department":"CSE","student_or_employee_id":"T-CSE-101"}'::jsonb,
  NOW(),
  NOW()
),
(
  'b0000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'sirajul.islam@baust.edu.bd',
  crypt('Password123!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Sirajul Islam","role":"TEACHER","department":"EEE","student_or_employee_id":"T-EEE-102"}'::jsonb,
  NOW(),
  NOW()
),

-- 4. STUDENT USERS (Shidratul Muntaha, Shah Md Al Junaid, Nusrat Jahan Jui)
(
  'd0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'shidratul.muntaha@baust.edu.bd',
  crypt('Password123!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Shidratul Muntaha","role":"STUDENT","department":"CSE","student_or_employee_id":"200201045"}'::jsonb,
  NOW(),
  NOW()
),
(
  'd0000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'al.junaid@baust.edu.bd',
  crypt('Password123!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Shah Md Al Junaid","role":"STUDENT","department":"CSE","student_or_employee_id":"200201050"}'::jsonb,
  NOW(),
  NOW()
),
(
  'd0000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'nusrat.jahan@baust.edu.bd',
  crypt('Password123!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Nusrat Jahan Jui","role":"STUDENT","department":"CSE","student_or_employee_id":"200201072"}'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  updated_at = NOW();

-- ==============================================================================
-- 3. PROFILES DIRECTORY (Explicit upsert matching handle_new_user trigger)
-- ==============================================================================
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
VALUES
-- Admin
('a0000000-0000-0000-0000-000000000001', 'admin@baust.edu.bd', 'Col. Md. Zahid Hossain (Retd)', 'ADMIN', 'Estate Office', 'ADM-BAUST-001', true, true),

-- Staff
('c0000000-0000-0000-0000-000000000001', 'staff.rafiqul@baust.edu.bd', 'Md. Rafiqul Islam', 'STAFF', 'Campus Sanitation', 'STF-CLN-001', true, true),
('c0000000-0000-0000-0000-000000000002', 'staff.morjina@baust.edu.bd', 'Mst. Morjina Begum', 'STAFF', 'Campus Sanitation', 'STF-CLN-002', true, true),

-- Teachers
('b0000000-0000-0000-0000-000000000001', 'rakib.trofder@baust.edu.bd', 'Rakib Trofder', 'TEACHER', 'CSE', 'T-CSE-101', true, true),
('b0000000-0000-0000-0000-000000000002', 'sirajul.islam@baust.edu.bd', 'Sirajul Islam', 'TEACHER', 'EEE', 'T-EEE-102', true, true),

-- Students
('d0000000-0000-0000-0000-000000000001', 'shidratul.muntaha@baust.edu.bd', 'Shidratul Muntaha', 'STUDENT', 'CSE', '200201045', true, true),
('d0000000-0000-0000-0000-000000000002', 'al.junaid@baust.edu.bd', 'Shah Md Al Junaid', 'STUDENT', 'CSE', '200201050', true, true),
('d0000000-0000-0000-0000-000000000003', 'nusrat.jahan@baust.edu.bd', 'Nusrat Jahan Jui', 'STUDENT', 'CSE', '200201072', true, true)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  student_or_employee_id = EXCLUDED.student_or_employee_id,
  is_verified = true,
  is_active = true,
  updated_at = NOW();

-- ==============================================================================
-- 4. CLEANING STAFF OPERATIONAL PROFILES
-- ==============================================================================
INSERT INTO public.staff_profiles (
  user_id,
  shift_start,
  shift_end,
  is_available,
  max_concurrent_tasks,
  assigned_department,
  assigned_building
)
VALUES
(
  'c0000000-0000-0000-0000-000000000001',
  '07:00:00',
  '15:00:00',
  true,
  3,
  'Sanitation',
  'Academic Building 1 (ECE)'
),
(
  'c0000000-0000-0000-0000-000000000002',
  '08:00:00',
  '16:00:00',
  true,
  3,
  'Sanitation',
  'Administration Building'
)
ON CONFLICT (user_id) DO UPDATE SET
  shift_start = EXCLUDED.shift_start,
  shift_end = EXCLUDED.shift_end,
  is_available = true,
  assigned_building = EXCLUDED.assigned_building,
  updated_at = NOW();

-- ==============================================================================
-- 5. INITIAL OPERATIONAL INCIDENTS & WORK ORDERS
-- ==============================================================================
INSERT INTO public.issues (
  id,
  reference_number,
  reporter_id,
  location_id,
  category,
  description,
  priority,
  status,
  photo_urls,
  proof_photo_urls,
  sla_deadline,
  created_at
)
VALUES
-- Issue 1: Submitted (Unassigned - Ready for Triage/Auto-Dispatch)
(
  'f0000000-0000-0000-0000-000000000001',
  'CCMS-20261118-1001',
  'd0000000-0000-0000-0000-000000000001', -- Shidratul Muntaha
  '10000000-0000-0000-0000-000000000011', -- Software Lab 102
  'CLASSROOM',
  'Whiteboard marker residue and unemptied paper trash bins after morning algorithms lab session.',
  'MEDIUM',
  'SUBMITTED',
  ARRAY['https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=600'],
  '{}',
  NOW() + INTERVAL '4 hours',
  NOW() - INTERVAL '45 minutes'
),

-- Issue 2: Assigned to Staff (Md. Rafiqul Islam)
(
  'f0000000-0000-0000-0000-000000000002',
  'CCMS-20261118-1002',
  'd0000000-0000-0000-0000-000000000002', -- Shah Md Al Junaid
  '10000000-0000-0000-0000-000000000010', -- Washroom Block G
  'WASHROOM',
  'Water overflow near hand-washing vanity sink and empty liquid soap dispenser.',
  'HIGH',
  'ASSIGNED',
  ARRAY['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600'],
  '{}',
  NOW() + INTERVAL '2 hours',
  NOW() - INTERVAL '1 hour'
),

-- Issue 3: In Progress (Commenced with on-site cleaning)
(
  'f0000000-0000-0000-0000-000000000003',
  'CCMS-20261118-1003',
  'd0000000-0000-0000-0000-000000000003', -- Nusrat Jahan Jui
  '10000000-0000-0000-0000-000000000070', -- BAUST Central Cafeteria
  'CANTEEN',
  'Spilled beverages and food trays left on central dining tables near the faculty section.',
  'MEDIUM',
  'IN_PROGRESS',
  ARRAY['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=600'],
  '{}',
  NOW() + INTERVAL '3 hours',
  NOW() - INTERVAL '2 hours'
),

-- Issue 4: Resolved (Ready for Teacher/Supervisor Sign-Off — Rakib Trofder / Sirajul Islam)
(
  'f0000000-0000-0000-0000-000000000004',
  'CCMS-20261118-1004',
  'd0000000-0000-0000-0000-000000000001', -- Shidratul Muntaha
  '10000000-0000-0000-0000-000000000012', -- Lecture Gallery 201
  'CLASSROOM',
  'Desks sanitized and aisle floors mopped following the engineering physics exam.',
  'LOW',
  'RESOLVED',
  ARRAY['https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=600'],
  ARRAY['https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=600'],
  NOW() + INTERVAL '6 hours',
  NOW() - INTERVAL '3 hours'
)
ON CONFLICT (id) DO NOTHING;

-- Task assignment link for active staff
INSERT INTO public.task_assignments (
  id,
  issue_id,
  staff_id,
  assigned_by,
  is_auto_assigned,
  assigned_at,
  started_at,
  status
)
VALUES
(
  'e0000000-0000-0000-0000-000000000002',
  'f0000000-0000-0000-0000-000000000002',
  'c0000000-0000-0000-0000-000000000001', -- Md. Rafiqul Islam
  'a0000000-0000-0000-0000-000000000001',
  false,
  NOW() - INTERVAL '40 minutes',
  NULL,
  'ACTIVE'
),
(
  'e0000000-0000-0000-0000-000000000003',
  'f0000000-0000-0000-0000-000000000003',
  'c0000000-0000-0000-0000-000000000001', -- Md. Rafiqul Islam
  'a0000000-0000-0000-0000-000000000001',
  false,
  NOW() - INTERVAL '90 minutes',
  NOW() - INTERVAL '60 minutes',
  'ACTIVE'
),
(
  'e0000000-0000-0000-0000-000000000004',
  'f0000000-0000-0000-0000-000000000004',
  'c0000000-0000-0000-0000-000000000002', -- Mst. Morjina Begum
  'a0000000-0000-0000-0000-000000000001',
  true,
  NOW() - INTERVAL '150 minutes',
  NOW() - INTERVAL '120 minutes',
  'COMPLETED'
)
ON CONFLICT (id) DO NOTHING;
