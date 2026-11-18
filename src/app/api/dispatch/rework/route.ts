import { NextRequest, NextResponse } from 'next/server';
import { dispatchService } from '@/services/dispatch.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { issue_id, reason } = body;

    if (!issue_id) {
      return NextResponse.json({ error: 'issue_id is required' }, { status: 400 });
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json({ error: 'Reason for rework is required' }, { status: 400 });
    }

    const res = await dispatchService.requestRework({
      issue_id,
      reason: reason.trim(),
    });

    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({ message: 'Rework requested successfully', data: res.data });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to request rework' },
      { status: 500 }
    );
  }
}

