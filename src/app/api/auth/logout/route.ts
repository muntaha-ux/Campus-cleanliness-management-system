import { NextResponse } from 'next/server';
import { SupabaseAuthRepository } from '@/infrastructure/supabase/SupabaseAuthRepository';

export async function POST() {
  try {
    const authRepo = new SupabaseAuthRepository();
    const result = await authRepo.signOut();

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ message: 'Signed out successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}

