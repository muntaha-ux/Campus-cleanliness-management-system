import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { dispatchService } from '@/services/dispatch.service';

export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filterStaffId = searchParams.get('staff_id') || user.id;

    const { data, error } = await supabase
      .from('task_assignments')
      .select('*, issue:issues(*, location:locations(*))')
      .eq('staff_id', filterStaffId)
      .order('assigned_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tasks: data });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { issue_id, staff_id, auto_dispatch } = body;

    if (!issue_id) {
      return NextResponse.json({ error: 'issue_id is required' }, { status: 400 });
    }

    if (auto_dispatch) {
      const autoRes = await dispatchService.autoDispatch(issue_id);
      if (autoRes.error) {
        return NextResponse.json({ error: autoRes.error }, { status: 400 });
      }
      return NextResponse.json({ message: 'Issue auto-dispatched successfully', data: autoRes.data });
    }

    if (!staff_id) {
      return NextResponse.json({ error: 'staff_id is required for manual assignment' }, { status: 400 });
    }

    const res = await dispatchService.assignTask({ issue_id, staff_id });
    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({ message: 'Task assigned successfully', data: res.data });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to assign task' },
      { status: 500 }
    );
  }
}

