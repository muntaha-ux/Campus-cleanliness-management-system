import { NextRequest, NextResponse } from 'next/server';
import { analyticsService } from '@/services/analytics.service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const reportMonth = searchParams.get('month') || currentMonth;

    const res = await analyticsService.getMonthlyReport(reportMonth);
    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 404 });
    }

    return NextResponse.json({ report: res.data });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to fetch monthly report' },
      { status: 500 }
    );
  }
}
