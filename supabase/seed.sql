-- ==============================================================================
-- Seed: seed.sql
-- Description: Campus Geographic Registry & Initial System Settings
-- Project: Campus Cleanliness Management System
-- ==============================================================================

-- Seed Sample Campus Locations
INSERT INTO public.locations (id, building, floor, room, specific_area, department, category, footfall_weight, qr_code_hash)
VALUES
('00000000-0000-0000-0000-000000000001', 'Academic Building 1', 'Ground Floor', 'Washroom 101', 'Male Restroom Near Lobby', 'Janitorial', 'WASHROOM', 2.00, 'loc_ab1_g_w101'),
('00000000-0000-0000-0000-000000000002', 'Academic Building 1', '1st Floor', 'Room 102', 'Main Lecture Hall', 'Academic Facilities', 'CLASSROOM', 1.50, 'loc_ab1_1_r102'),
('00000000-0000-0000-0000-000000000003', 'Academic Building 2', '2nd Floor', 'Corridor North', 'North Hallway Trash Station', 'Janitorial', 'CORRIDOR', 1.20, 'loc_ab2_2_north'),
('00000000-0000-0000-0000-000000000004', 'Student Cafeteria', 'Ground Floor', 'Dining Hall A', 'Tray Return & Waste Bin Area', 'Food Services', 'CANTEEN', 2.50, 'loc_cafe_g_dining_a'),
('00000000-0000-0000-0000-000000000005', 'Central Library', 'Ground Floor', 'Entrance Foyer', 'Main Entry Steps & Planters', 'Grounds', 'OUTDOOR', 1.80, 'loc_lib_g_foyer'),
('00000000-0000-0000-0000-000000000006', 'Dormitory Hall 1', '3rd Floor', 'Common Room', 'Shared Kitchenette & Sink', 'Residential', 'HOSTEL', 1.40, 'loc_dh1_3_common')
ON CONFLICT (qr_code_hash) DO NOTHING;

