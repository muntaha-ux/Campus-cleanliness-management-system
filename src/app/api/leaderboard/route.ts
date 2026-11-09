import { NextRequest, NextResponse } from 'next/server';
import { analyticsService } from '@/services/analytics.service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '15', 10);
    const date = searchParams.get('date') || undefined;

    const res = await analyticsService.getAreaCleanlinessRankings(date);
    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    const data = (res.data || []).slice(0, limit);
    return NextResponse.json({ leaderboard: data });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
