import { NextRequest, NextResponse } from 'next/server';
import { signUpSchema } from '@/presentation/validators/auth.validator';
import { SupabaseAuthRepository } from '@/infrastructure/supabase/SupabaseAuthRepository';
import { SupabaseProfileRepository } from '@/infrastructure/supabase/SupabaseProfileRepository';
import { AuthUseCases } from '@/core/usecases/auth/AuthUseCases';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = signUpSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validatedData.error.flatten() },
        { status: 400 }
      );
    }

    const authRepo = new SupabaseAuthRepository();
    const profileRepo = new SupabaseProfileRepository();
    const useCases = new AuthUseCases(authRepo, profileRepo);

    const result = await useCases.register(validatedData.data);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      message: 'Registration successful',
      user: result.user,
      profile: result.profile,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}

