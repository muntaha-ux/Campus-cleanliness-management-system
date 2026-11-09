import { createSupabaseServerClient, createSupabaseAdminClient } from '@/config/supabase';
import { Profile, UserRole } from '@/core/domain/user.types';
import {
  AuthResponse,
  IAuthRepository,
  SignInParams,
  SignUpParams,
} from '@/core/interfaces/IAuthRepository';
import { AuditLoggingService } from '../audit/AuditLoggingService';

export class SupabaseAuthRepository implements IAuthRepository {
  private auditService = AuditLoggingService.getInstance();

  public async signUp(params: SignUpParams): Promise<AuthResponse> {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          full_name: params.full_name,
          role: params.role,
          department: params.department || null,
          student_or_employee_id: params.student_or_employee_id || null,
        },
      },
    });

    if (error) {
      await this.auditService.logAuthEvent({
        actor_id: null,
        action: 'AUTH_REGISTER',
        email: params.email,
        error_message: error.message,
        is_security_critical: true,
      });
      return { user: null, profile: null, error: error.message };
    }

    if (!data.user) {
      return { user: null, profile: null, error: 'User registration failed' };
    }

    // Fetch the newly triggered public.profile
    const admin = createSupabaseAdminClient();
    const { data: profile } = await admin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    await this.auditService.logAuthEvent({
      actor_id: data.user.id,
      actor_role: params.role,
      action: 'AUTH_REGISTER',
      email: params.email,
    });

    return {
      user: {
        id: data.user.id,
        email: data.user.email!,
        role: (profile?.role || params.role) as UserRole,
      },
      profile: profile as Profile | null,
    };
  }

  public async signIn(params: SignInParams): Promise<AuthResponse> {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: params.email,
      password: params.password,
    });

    if (error) {
      await this.auditService.logAuthEvent({
        actor_id: null,
        action: 'AUTH_LOGIN_FAILED',
        email: params.email,
        error_message: error.message,
        is_security_critical: true,
      });
      return { user: null, profile: null, error: error.message };
    }

    if (!data.user) {
      return { user: null, profile: null, error: 'Sign in failed' };
    }

    // Check if account is active (#16)
    const admin = createSupabaseAdminClient();
    const { data: profile } = await admin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profile && !profile.is_active) {
      await supabase.auth.signOut();
      await this.auditService.logAuthEvent({
        actor_id: data.user.id,
        actor_role: profile.role,
        action: 'AUTH_LOGIN_FAILED',
        email: params.email,
        error_message: 'Account is deactivated',
        is_security_critical: true,
      });
      return {
        user: null,
        profile: null,
        error: 'Your account has been deactivated. Please contact the campus administrator.',
      };
    }

    await this.auditService.logAuthEvent({
      actor_id: data.user.id,
      actor_role: profile?.role || 'STUDENT',
      action: 'AUTH_LOGIN',
      email: params.email,
    });

    return {
      user: {
        id: data.user.id,
        email: data.user.email!,
        role: (profile?.role || 'STUDENT') as UserRole,
      },
      profile: profile as Profile | null,
    };
  }

  public async signOut(): Promise<{ error?: string | null }> {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await this.auditService.logAuthEvent({
        actor_id: user.id,
        action: 'AUTH_LOGOUT',
        email: user.email || 'unknown',
      });
    }

    const { error } = await supabase.auth.signOut();
    return { error: error?.message || null };
  }

  public async requestPasswordReset(email: string, redirectTo?: string): Promise<{ error?: string | null }> {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`,
    });

    await this.auditService.logAuthEvent({
      actor_id: null,
      action: 'AUTH_PASSWORD_RESET_REQUEST',
      email,
      error_message: error?.message,
      is_security_critical: true,
    });

    return { error: error?.message || null };
  }

  public async updatePassword(newPassword: string): Promise<{ error?: string | null }> {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (user) {
      await this.auditService.log({
        actor_id: user.id,
        actor_role: null,
        action: 'AUTH_PASSWORD_UPDATE',
        entity_type: 'USER',
        entity_id: user.id,
        is_security_critical: true,
      });
    }

    return { error: error?.message || null };
  }

  public async getCurrentUser(): Promise<AuthResponse> {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return { user: null, profile: null, error: error?.message || 'No session' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return {
      user: {
        id: user.id,
        email: user.email!,
        role: (profile?.role || 'STUDENT') as UserRole,
      },
      profile: profile as Profile | null,
    };
  }
}

