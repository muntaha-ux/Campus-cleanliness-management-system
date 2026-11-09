export type UserRole = 'STUDENT' | 'TEACHER' | 'STAFF' | 'ADMIN';

export interface UserNotificationPreferences {
  email: boolean;
  in_app: boolean;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  profile_photo_url: string | null;
  department: string | null;
  student_or_employee_id: string | null;
  is_verified: boolean;
  is_active: boolean;
  notification_preferences: UserNotificationPreferences;
  created_at: string;
  updated_at: string;
}

export interface StaffProfile {
  user_id: string;
  shift_start: string; // HH:MM:SS
  shift_end: string;   // HH:MM:SS
  is_available: boolean;
  max_concurrent_tasks: number;
  assigned_department: string | null;
  assigned_building: string | null;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  is_verified: boolean;
  is_active: boolean;
  profile?: Profile;
}

