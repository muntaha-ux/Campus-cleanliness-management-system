import { NextRequest, NextResponse } from 'next/server';
import { dispatchService } from '@/services/dispatch.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { issue_id, is_satisfactory, student_rating, staff_rating, feedback_notes, reopen_reason } = body;

    if (!issue_id) {
      return NextResponse.json({ error: 'issue_id is required' }, { status: 400 });
    }

    const res = await dispatchService.verifyOrReopen({
      issue_id,
      is_satisfactory: Boolean(is_satisfactory),
      student_rating: student_rating ? Number(student_rating) : undefined,
      staff_rating: staff_rating ? Number(staff_rating) : undefined,
      feedback_notes,
      reopen_reason,
    });

    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({ data: res.data });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to process verification' },
      { status: 500 }
    );
  }
}
