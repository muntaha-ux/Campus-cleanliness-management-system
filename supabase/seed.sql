-- ==============================================================================
-- Seed: seed.sql
-- Description: Authentic BAUST Saidpur Cantonment Geographic & Facility Registry
-- Project: Campus Cleanliness Management System — BAUST Edition
-- Location: Bangladesh Army University of Science and Technology (BAUST), Saidpur
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
