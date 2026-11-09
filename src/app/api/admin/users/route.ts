import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/config/supabase';
import { updateRoleSchema, updateActiveStatusSchema } from '@/presentation/validators/auth.validator';
import { SupabaseProfileRepository } from '@/infrastructure/supabase/SupabaseProfileRepository';
import { SupabaseAuthRepository } from '@/infrastructure/supabase/SupabaseAuthRepository';
import { AuthUseCases } from '@/core/usecases/auth/AuthUseCases';
import { AuditLoggingService } from '@/infrastructure/audit/AuditLoggingService';

export async function GET(req: NextRequest) {
  try {
    const authRepo = new SupabaseAuthRepository();
    const currentUser = await authRepo.getCurrentUser();

    if (!currentUser.user || currentUser.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const admin = createSupabaseAdminClient();
    let query = admin
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (role) {
      query = query.eq('role', role);
    }

    const { data, count, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: data, total: count });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}

// Update Role or Active Status (#12, #16)
export async function PATCH(req: NextRequest) {
  try {
    const authRepo = new SupabaseAuthRepository();
    const currentUser = await authRepo.getCurrentUser();

    if (!currentUser.user || currentUser.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const profileRepo = new SupabaseProfileRepository();
    const useCases = new AuthUseCases(authRepo, profileRepo);

    // 1. Role Update
    if ('role' in body) {
      const parsed = updateRoleSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid role update payload', details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      const updated = await useCases.changeUserRole(parsed.data.userId, parsed.data.role);

      await AuditLoggingService.getInstance().logRoleChange({
        actor_id: currentUser.user.id,
        actor_role: 'ADMIN',
        target_user_id: parsed.data.userId,
        old_role: 'PREVIOUS',
        new_role: parsed.data.role,
      });

      return NextResponse.json({ message: 'User role updated', profile: updated });
    }

    // 2. Active Status Toggle
    if ('isActive' in body) {
      const parsed = updateActiveStatusSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid status payload', details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      const updated = await useCases.toggleUserStatus(parsed.data.userId, parsed.data.isActive);
      return NextResponse.json({
        message: `User account ${parsed.data.isActive ? 'activated' : 'deactivated'}`,
        profile: updated,
      });
    }

    return NextResponse.json({ error: 'Missing role or isActive field' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}

