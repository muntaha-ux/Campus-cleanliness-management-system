import { createSupabaseServerClient, createSupabaseAdminClient } from '@/config/supabase';
import { Profile, StaffProfile, UserRole } from '@/core/domain/user.types';
import {
  IProfileRepository,
  UpdateProfileParams,
} from '@/core/interfaces/IProfileRepository';
import { AuditLoggingService } from '../audit/AuditLoggingService';

export class SupabaseProfileRepository implements IProfileRepository {
  private auditService = AuditLoggingService.getInstance();

  public async getProfileById(userId: string): Promise<Profile | null> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;
    return data as Profile;
  }

  public async updateProfile(userId: string, params: UpdateProfileParams): Promise<Profile> {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const oldProfile = await this.getProfileById(userId);

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...(params.full_name !== undefined && { full_name: params.full_name }),
        ...(params.department !== undefined && { department: params.department }),
        ...(params.student_or_employee_id !== undefined && {
          student_or_employee_id: params.student_or_employee_id,
        }),
        ...(params.profile_photo_url !== undefined && {
          profile_photo_url: params.profile_photo_url,
        }),
        ...(params.notification_preferences !== undefined && {
          notification_preferences: params.notification_preferences,
        }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update profile: ${error?.message}`);
    }

    if (user) {
      await this.auditService.logProfileUpdate({
        actor_id: user.id,
        actor_role: oldProfile?.role || 'STUDENT',
        target_user_id: userId,
        changes_before: (oldProfile as unknown as Record<string, unknown>) || {},
        changes_after: params as Record<string, unknown>,
      });
    }

    return data as Profile;
  }

  public async updateUserRole(userId: string, newRole: UserRole): Promise<Profile> {
    const admin = createSupabaseAdminClient();
    const oldProfile = await this.getProfileById(userId);

    const { data, error } = await admin
      .from('profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update user role: ${error?.message}`);
    }

    // Also sync staff_profiles table if role became STAFF (#43)
    if (newRole === 'STAFF') {
      await admin
        .from('staff_profiles')
        .upsert({
          user_id: userId,
          shift_start: '08:00:00',
          shift_end: '16:00:00',
          is_available: true,
          max_concurrent_tasks: 3,
          assigned_department: data.department || 'Janitorial',
        })
        .select();
    }

    return data as Profile;
  }

  public async setUserActiveStatus(userId: string, isActive: boolean): Promise<Profile> {
    const admin = createSupabaseAdminClient();
    const oldProfile = await this.getProfileById(userId);

    const { data, error } = await admin
      .from('profiles')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update user status: ${error?.message}`);
    }

    // Also update auth.users ban status if deactivating (#16)
    if (!isActive) {
      await admin.auth.admin.updateUserById(userId, {
        ban_duration: '876000h', // 100 years
      });
    } else {
      await admin.auth.admin.updateUserById(userId, {
        ban_duration: 'none',
      });
    }

    await this.auditService.log({
      actor_id: null,
      actor_role: 'ADMIN',
      action: 'PROFILE_STATUS_CHANGE',
      entity_type: 'PROFILE',
      entity_id: userId,
      state_before: { is_active: oldProfile?.is_active },
      state_after: { is_active: isActive },
      is_security_critical: true,
    });

    return data as Profile;
  }

  public async getStaffProfile(userId: string): Promise<StaffProfile | null> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('staff_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;
    return data as StaffProfile;
  }

  public async updateStaffAvailability(userId: string, isAvailable: boolean): Promise<StaffProfile> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('staff_profiles')
      .update({ is_available: isAvailable, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update staff availability: ${error?.message}`);
    }

    return data as StaffProfile;
  }

  public async uploadAvatar(userId: string, file: Blob, fileExtension: string): Promise<string> {
    const supabase = await createSupabaseServerClient();
    const filePath = `${userId}/avatar-${Date.now()}.${fileExtension}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload avatar: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Save public url to profile
    await this.updateProfile(userId, { profile_photo_url: publicUrl });

    await this.auditService.log({
      actor_id: userId,
      actor_role: null,
      action: 'PROFILE_PHOTO_UPLOAD',
      entity_type: 'PROFILE',
      entity_id: userId,
      state_after: { url: publicUrl },
      is_security_critical: false,
    });

    return publicUrl;
  }
}

