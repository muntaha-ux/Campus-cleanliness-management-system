import { NextRequest, NextResponse } from 'next/server';
import { issueService } from '@/services/issue.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { issue_id, reason } = body;

    if (!issue_id) {
      return NextResponse.json({ error: 'issue_id is required' }, { status: 400 });
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json({ error: 'Reason for rejection is required' }, { status: 400 });
    }

    const res = await issueService.rejectIssue(issue_id, reason.trim());

    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({ message: 'Issue rejected and closed', data: res.data });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to reject issue' },
      { status: 500 }
    );
  }
}

