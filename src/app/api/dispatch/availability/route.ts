import { NextRequest, NextResponse } from 'next/server';
import { dispatchService } from '@/services/dispatch.service';

export async function POST(req: NextRequest) {
  try {
    const { is_available } = await req.json();

    const res = await dispatchService.toggleAvailability(Boolean(is_available));
    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({ data: res.data });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to update shift availability' },
      { status: 500 }
    );
  }
}

