import { NextRequest, NextResponse } from 'next/server';
import { SupabaseAuthRepository } from '@/infrastructure/supabase/SupabaseAuthRepository';
import { AuditLoggingService } from '@/infrastructure/audit/AuditLoggingService';

export async function GET(req: NextRequest) {
  try {
    const authRepo = new SupabaseAuthRepository();
    const currentUser = await authRepo.getCurrentUser();

    if (!currentUser.user || currentUser.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const actor_id = searchParams.get('actor_id') || undefined;
    const action = searchParams.get('action') || undefined;
    const entity_type = searchParams.get('entity_type') || undefined;
    const entity_id = searchParams.get('entity_id') || undefined;
    const is_security_critical = searchParams.has('is_security_critical')
      ? searchParams.get('is_security_critical') === 'true'
      : undefined;
    const start_date = searchParams.get('start_date') || undefined;
    const end_date = searchParams.get('end_date') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const auditService = AuditLoggingService.getInstance();
    const result = await auditService.query({
      actor_id,
      action,
      entity_type,
      entity_id,
      is_security_critical,
      start_date,
      end_date,
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}

