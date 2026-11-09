import { Profile, StaffProfile, UserRole } from '../domain/user.types';

export interface UpdateProfileParams {
  full_name?: string;
  department?: string;
  student_or_employee_id?: string;
  profile_photo_url?: string;
  notification_preferences?: {
    email: boolean;
    in_app: boolean;
  };
}

export interface IProfileRepository {
  getProfileById(userId: string): Promise<Profile | null>;
  updateProfile(userId: string, params: UpdateProfileParams): Promise<Profile>;
  updateUserRole(userId: string, newRole: UserRole): Promise<Profile>;
  setUserActiveStatus(userId: string, isActive: boolean): Promise<Profile>;
  getStaffProfile(userId: string): Promise<StaffProfile | null>;
  updateStaffAvailability(userId: string, isAvailable: boolean): Promise<StaffProfile>;
  uploadAvatar(userId: string, file: Blob, fileExtension: string): Promise<string>;
}

