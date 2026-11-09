import { NextRequest, NextResponse } from 'next/server';
import { forgotPasswordSchema, resetPasswordSchema } from '@/presentation/validators/auth.validator';
import { SupabaseAuthRepository } from '@/infrastructure/supabase/SupabaseAuthRepository';

// Request Password Reset Link
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = forgotPasswordSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid email address', details: validatedData.error.flatten() },
        { status: 400 }
      );
    }

    const authRepo = new SupabaseAuthRepository();
    const result = await authRepo.requestPasswordReset(validatedData.data.email);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      message: 'Password reset email sent if an account with that email exists.',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}

// Update Password (when user is authenticated via reset recovery token)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = resetPasswordSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid password format', details: validatedData.error.flatten() },
        { status: 400 }
      );
    }

    const authRepo = new SupabaseAuthRepository();
    const result = await authRepo.updatePassword(validatedData.data.password);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}

