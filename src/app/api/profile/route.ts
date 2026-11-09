import { NextRequest, NextResponse } from 'next/server';
import { updateProfileSchema } from '@/presentation/validators/auth.validator';
import { SupabaseAuthRepository } from '@/infrastructure/supabase/SupabaseAuthRepository';
import { SupabaseProfileRepository } from '@/infrastructure/supabase/SupabaseProfileRepository';
import { AuthUseCases } from '@/core/usecases/auth/AuthUseCases';

export async function GET() {
  try {
    const authRepo = new SupabaseAuthRepository();
    const profileRepo = new SupabaseProfileRepository();
    const useCases = new AuthUseCases(authRepo, profileRepo);

    const currentUser = await useCases.getCurrentUser();
    if (!currentUser.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await useCases.getProfile(currentUser.user.id);
    return NextResponse.json({ user: currentUser.user, profile });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authRepo = new SupabaseAuthRepository();
    const profileRepo = new SupabaseProfileRepository();
    const useCases = new AuthUseCases(authRepo, profileRepo);

    const currentUser = await useCases.getCurrentUser();
    if (!currentUser.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = updateProfileSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid profile data', details: validatedData.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await useCases.updateProfile(currentUser.user.id, {
      ...(validatedData.data.full_name && { full_name: validatedData.data.full_name }),
      ...(validatedData.data.department !== undefined && { department: validatedData.data.department ?? undefined }),
      ...(validatedData.data.student_or_employee_id !== undefined && {
        student_or_employee_id: validatedData.data.student_or_employee_id ?? undefined,
      }),
      ...(validatedData.data.profile_photo_url !== undefined && {
        profile_photo_url: validatedData.data.profile_photo_url ?? undefined,
      }),
      ...(validatedData.data.notification_preferences && {
        notification_preferences: validatedData.data.notification_preferences,
      }),
    });

    return NextResponse.json({ message: 'Profile updated successfully', profile: updated });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}

