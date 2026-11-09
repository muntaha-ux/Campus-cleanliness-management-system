import { NextRequest, NextResponse } from 'next/server';
import { issueService } from '@/services/issue.service';
import { analyticsService, IssueSearchFilters } from '@/services/analytics.service';
import { IssuePriority, IssueStatus } from '@/types/database.types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filters: IssueSearchFilters = {
      searchTerm: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      building: searchParams.get('building') || undefined,
      floor: searchParams.get('floor') || undefined,
      status: (searchParams.get('status') as IssueStatus) || undefined,
      priority: (searchParams.get('priority') as IssuePriority) || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'created_at',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
      limit: parseInt(searchParams.get('limit') || '20', 10),
      offset: parseInt(searchParams.get('offset') || '0', 10),
    };

    const res = await analyticsService.searchIssues(filters);
    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json(res.data);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to search issues' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const forwardedFor = req.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

    const result = await issueService.createIssue({
      location_id: body.location_id,
      category: body.category,
      description: body.description,
      priority: body.priority,
      photo_urls: body.photo_urls,
      is_anonymous: Boolean(body.is_anonymous),
      client_ip: clientIp,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to submit cleanliness report' },
      { status: 500 }
    );
  }
}

