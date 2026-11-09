import { Profile, UserRole } from '../domain/user.types';

export interface SignUpParams {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  department?: string;
  student_or_employee_id?: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    role: UserRole;
  } | null;
  profile: Profile | null;
  error?: string | null;
}

export interface IAuthRepository {
  signUp(params: SignUpParams): Promise<AuthResponse>;
  signIn(params: SignInParams): Promise<AuthResponse>;
  signOut(): Promise<{ error?: string | null }>;
  requestPasswordReset(email: string, redirectTo?: string): Promise<{ error?: string | null }>;
  updatePassword(newPassword: string): Promise<{ error?: string | null }>;
  getCurrentUser(): Promise<AuthResponse>;
}

