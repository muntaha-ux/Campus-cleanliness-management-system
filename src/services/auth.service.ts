import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { Database, ServiceResponse, UserRole } from '@/types/database.types';
import { withAuditLog } from './audit.interceptor';

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type StaffProfileRow = Database['public']['Tables']['staff_profiles']['Row'];

export interface RegisterDTO {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  department?: string;
  student_or_employee_id?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface UpdateProfileDTO {
  full_name?: string;
  department?: string;
  student_or_employee_id?: string;
  profile_photo_url?: string;
  notification_preferences?: {
    email: boolean;
    in_app: boolean;
  };
}

class AuthService {
  /**
   * User Registration (#1, #8)
   * Invokes Supabase Auth with metadata.
   * Trigger on_auth_user_created populates public.profiles and staff_profiles.
   */
  public async register(dto: RegisterDTO): Promise<ServiceResponse<{ user_id: string; email: string }>> {
    try {
      const serverClient = await getSupabaseServerClient();

      const { data, error } = await serverClient.auth.signUp({
        email: dto.email,
        password: dto.password,
        options: {
          data: {
            full_name: dto.full_name,
            role: dto.role,
            department: dto.department || null,
            student_or_employee_id: dto.student_or_employee_id || null,
          },
        },
      });

      if (error) {
        return { data: null, error: error.message };
      }

      if (!data.user) {
        return { data: null, error: 'Registration failed: No user returned.' };
      }

      // If registered as STAFF, ensure staff_profiles row is initialized
      if (dto.role === 'STAFF') {
        const adminClient = getSupabaseAdminClient();
        await adminClient.from('staff_profiles').upsert({
          user_id: data.user.id,
          shift_start: '08:00:00',
          shift_end: '16:00:00',
          is_available: true,
          max_concurrent_tasks: 3,
          assigned_department: dto.department || 'Janitorial',
        });
      }

      return {
        data: {
          user_id: data.user.id,
          email: data.user.email || dto.email,
        },
        error: null,
      };
    } catch (err) {
      return { data: null, error: (err as Error).message };
    }
  }

  /**
   * User Login (#1, #8)
   */
  public async login(dto: LoginDTO): Promise<ServiceResponse<{ user_id: string; role: UserRole; profile: ProfileRow }>> {
    try {
      const serverClient = await getSupabaseServerClient();

      const { data, error } = await serverClient.auth.signInWithPassword({
        email: dto.email,
        password: dto.password,
      });

      if (error) {
        return { data: null, error: error.message };
      }

      if (!data.user) {
        return { data: null, error: 'Authentication failed.' };
      }

      // Inspect active status from public.profiles (#16)
      const adminClient = getSupabaseAdminClient();
      const { data: profile, error: profileErr } = await adminClient
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileErr || !profile) {
        return { data: null, error: 'Associated profile not found.' };
      }

      if (!profile.is_active) {
        await serverClient.auth.signOut();
        return {
          data: null,
          error: 'Your account has been deactivated. Please contact campus administration.',
        };
      }

      return {
        data: {
          user_id: data.user.id,
          role: profile.role,
          profile,
        },
        error: null,
      };
    } catch (err) {
      return { data: null, error: (err as Error).message };
    }
  }

  /**
   * User Sign Out
   */
  public async logout(): Promise<ServiceResponse<boolean>> {
    try {
      const serverClient = await getSupabaseServerClient();
      const { error } = await serverClient.auth.signOut();
      if (error) return { data: null, error: error.message };
      return { data: true, error: null };
    } catch (err) {
      return { data: null, error: (err as Error).message };
    }
  }

  /**
   * Request Password Reset Email (#15)
   */
  public async requestPasswordReset(email: string, redirectTo?: string): Promise<ServiceResponse<boolean>> {
    try {
      const serverClient = await getSupabaseServerClient();
      const { error } = await serverClient.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`,
      });

      if (error) return { data: null, error: error.message };
      return { data: true, error: null };
    } catch (err) {
      return { data: null, error: (err as Error).message };
    }
  }

  /**
   * Update Password (#13, #15)
   */
  public async updatePassword(newPassword: string): Promise<ServiceResponse<boolean>> {
    try {
      const serverClient = await getSupabaseServerClient();
      const { error } = await serverClient.auth.updateUser({
        password: newPassword,
      });

      if (error) return { data: null, error: error.message };
      return { data: true, error: null };
    } catch (err) {
      return { data: null, error: (err as Error).message };
    }
  }

  /**
   * Get Current Authenticated Profile (#9, #10, #11)
   */
  public async getCurrentProfile(): Promise<ServiceResponse<ProfileRow>> {
    try {
      const serverClient = await getSupabaseServerClient();
      const { data: { user }, error: authErr } = await serverClient.auth.getUser();

      if (authErr || !user) {
        return { data: null, error: 'No active authenticated session.' };
      }

      const { data: profile, error } = await serverClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) return { data: null, error: error.message };
      return { data: profile, error: null };
    } catch (err) {
      return { data: null, error: (err as Error).message };
    }
  }

  /**
   * Update Profile (#9, #10, #11)
   */
  public async updateProfile(dto: UpdateProfileDTO): Promise<ServiceResponse<ProfileRow>> {
    try {
      const serverClient = await getSupabaseServerClient();
      const { data: { user } } = await serverClient.auth.getUser();

      if (!user) return { data: null, error: 'Unauthorized' };

      const updatePayload: Database['public']['Tables']['profiles']['Update'] = {
        updated_at: new Date().toISOString(),
      };
      if (dto.full_name !== undefined) updatePayload.full_name = dto.full_name;
      if (dto.department !== undefined) updatePayload.department = dto.department;
      if (dto.student_or_employee_id !== undefined) updatePayload.student_or_employee_id = dto.student_or_employee_id;
      if (dto.profile_photo_url !== undefined) updatePayload.profile_photo_url = dto.profile_photo_url;
      if (dto.notification_preferences !== undefined) updatePayload.notification_preferences = dto.notification_preferences;

      const { data, error } = await serverClient
        .from('profiles')
        .update(updatePayload)
        .eq('id', user.id)
        .select()
        .single();

      if (error) return { data: null, error: error.message };
      return { data, error: null };
    } catch (err) {
      return { data: null, error: (err as Error).message };
    }
  }

  /**
   * Upload Profile Photo (#17)
   * Uploads to Supabase Storage 'avatars' bucket with cache busting timestamp.
   */
  public async uploadAvatar(file: Blob, fileExtension: string): Promise<ServiceResponse<string>> {
    try {
      const serverClient = await getSupabaseServerClient();
      const { data: { user } } = await serverClient.auth.getUser();

      if (!user) return { data: null, error: 'Unauthorized' };

      const timestamp = Date.now();
      const filePath = `${user.id}/avatar-${timestamp}.${fileExtension}`;

      const { error: uploadErr } = await serverClient.storage
        .from('avatars')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadErr) return { data: null, error: uploadErr.message };

      const { data: { publicUrl } } = serverClient.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Invalidate and save URL to profile
      await this.updateProfile({ profile_photo_url: publicUrl });

      return { data: publicUrl, error: null };
    } catch (err) {
      return { data: null, error: (err as Error).message };
    }
  }

  /**
   * Admin: Change User Role (#12)
   */
  public async changeRole(userId: string, newRole: UserRole): Promise<ServiceResponse<ProfileRow>> {
    try {
      const adminClient = getSupabaseAdminClient();
      const { data, error } = await adminClient
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) return { data: null, error: error.message };

      if (newRole === 'STAFF') {
        await adminClient.from('staff_profiles').upsert({
          user_id: userId,
          shift_start: '08:00:00',
          shift_end: '16:00:00',
          is_available: true,
          max_concurrent_tasks: 3,
        });
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: (err as Error).message };
    }
  }

  /**
   * Admin: Toggle Active/Deactivated Account (#16)
   */
  public async setUserStatus(userId: string, isActive: boolean): Promise<ServiceResponse<ProfileRow>> {
    try {
      const adminClient = getSupabaseAdminClient();
      const { data, error } = await adminClient
        .from('profiles')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) return { data: null, error: error.message };

      if (!isActive) {
        await adminClient.auth.admin.updateUserById(userId, { ban_duration: '876000h' });
      } else {
        await adminClient.auth.admin.updateUserById(userId, { ban_duration: 'none' });
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: (err as Error).message };
    }
  }
}

const rawAuthService = new AuthService();

// Export with audit interceptor attached to state-mutating actions
export const authService = {
  register: rawAuthService.register.bind(rawAuthService),
  login: rawAuthService.login.bind(rawAuthService),
  logout: rawAuthService.logout.bind(rawAuthService),
  requestPasswordReset: rawAuthService.requestPasswordReset.bind(rawAuthService),
  updatePassword: withAuditLog(
    { action: 'AUTH_PASSWORD_UPDATE', entity_type: 'USER', entity_id: 'self', is_security_critical: true },
    rawAuthService.updatePassword.bind(rawAuthService)
  ),
  getCurrentProfile: rawAuthService.getCurrentProfile.bind(rawAuthService),
  updateProfile: withAuditLog(
    {
      action: 'PROFILE_UPDATE',
      entity_type: 'PROFILE',
      entity_id: (data) => (data as ProfileRow)?.id || 'unknown',
    },
    rawAuthService.updateProfile.bind(rawAuthService)
  ),
  uploadAvatar: rawAuthService.uploadAvatar.bind(rawAuthService),
  changeRole: withAuditLog(
    {
      action: 'PROFILE_ROLE_CHANGE',
      entity_type: 'PROFILE',
      entity_id: (data) => (data as ProfileRow)?.id || 'unknown',
      is_security_critical: true,
    },
    rawAuthService.changeRole.bind(rawAuthService)
  ),
  setUserStatus: withAuditLog(
    {
      action: 'PROFILE_STATUS_CHANGE',
      entity_type: 'PROFILE',
      entity_id: (data) => (data as ProfileRow)?.id || 'unknown',
      is_security_critical: true,
    },
    rawAuthService.setUserStatus.bind(rawAuthService)
  ),
};
