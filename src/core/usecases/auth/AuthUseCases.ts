import { IAuthRepository, SignInParams, SignUpParams, AuthResponse } from '@/core/interfaces/IAuthRepository';
import { IProfileRepository, UpdateProfileParams } from '@/core/interfaces/IProfileRepository';
import { Profile, UserRole } from '@/core/domain/user.types';

export class AuthUseCases {
  constructor(
    private authRepo: IAuthRepository,
    private profileRepo: IProfileRepository
  ) {}

  public async register(params: SignUpParams): Promise<AuthResponse> {
    return this.authRepo.signUp(params);
  }

  public async login(params: SignInParams): Promise<AuthResponse> {
    return this.authRepo.signIn(params);
  }

  public async logout(): Promise<{ error?: string | null }> {
    return this.authRepo.signOut();
  }

  public async requestPasswordReset(email: string, redirectTo?: string): Promise<{ error?: string | null }> {
    return this.authRepo.requestPasswordReset(email, redirectTo);
  }

  public async updatePassword(newPassword: string): Promise<{ error?: string | null }> {
    return this.authRepo.updatePassword(newPassword);
  }

  public async getCurrentUser(): Promise<AuthResponse> {
    return this.authRepo.getCurrentUser();
  }

  public async getProfile(userId: string): Promise<Profile | null> {
    return this.profileRepo.getProfileById(userId);
  }

  public async updateProfile(userId: string, params: UpdateProfileParams): Promise<Profile> {
    return this.profileRepo.updateProfile(userId, params);
  }

  public async changeUserRole(userId: string, newRole: UserRole): Promise<Profile> {
    return this.profileRepo.updateUserRole(userId, newRole);
  }

  public async toggleUserStatus(userId: string, isActive: boolean): Promise<Profile> {
    return this.profileRepo.setUserActiveStatus(userId, isActive);
  }
}

