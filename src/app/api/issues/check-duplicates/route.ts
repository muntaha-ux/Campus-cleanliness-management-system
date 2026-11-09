import { NextRequest, NextResponse } from 'next/server';
import { issueService } from '@/services/issue.service';

export async function POST(req: NextRequest) {
  try {
    const { location_id, category } = await req.json();

    if (!location_id || !category) {
      return NextResponse.json(
        { error: 'location_id and category are required' },
        { status: 400 }
      );
    }

    const res = await issueService.checkDuplicates(location_id, category);
    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({ duplicates: res.data || [] });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to check duplicates' },
      { status: 500 }
    );
  }
}

