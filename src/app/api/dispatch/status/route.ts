import { NextRequest, NextResponse } from 'next/server';
import { dispatchService } from '@/services/dispatch.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, issue_id, proof_photo_urls, resolution_notes } = body;

    if (!issue_id) {
      return NextResponse.json({ error: 'issue_id is required' }, { status: 400 });
    }

    if (action === 'START') {
      const res = await dispatchService.startTask(issue_id);
      if (res.error) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
      return NextResponse.json({ message: 'Task commenced', data: res.data });
    }

    if (action === 'RESOLVE') {
      if (!proof_photo_urls || !Array.isArray(proof_photo_urls) || proof_photo_urls.length === 0) {
        return NextResponse.json(
          { error: 'Proof photo is mandatory before marking a task as resolved (#46).' },
          { status: 400 }
        );
      }

      const res = await dispatchService.resolveTask({
        issue_id,
        proof_photo_urls,
        resolution_notes,
      });

      if (res.error) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }

      return NextResponse.json({ message: 'Task marked as resolved', data: res.data });
    }

    return NextResponse.json({ error: 'Invalid action. Expected START or RESOLVE.' }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to update task status' },
      { status: 500 }
    );
  }
}
