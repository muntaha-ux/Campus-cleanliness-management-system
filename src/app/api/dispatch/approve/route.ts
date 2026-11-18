import { NextRequest, NextResponse } from 'next/server';
import { dispatchService } from '@/services/dispatch.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { issue_id, notes, rating } = body;

    if (!issue_id) {
      return NextResponse.json({ error: 'issue_id is required' }, { status: 400 });
    }

    const res = await dispatchService.approveWork({
      issue_id,
      notes,
      rating: rating ? Number(rating) : 5,
    });

    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({ message: 'Work approved successfully', data: res.data });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to approve work' },
      { status: 500 }
    );
  }
}

