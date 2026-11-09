import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const building = searchParams.get('building');
    const qrCode = searchParams.get('qr');
    const floor = searchParams.get('floor');

    const supabase = await getSupabaseServerClient();
    let query = supabase
      .from('locations')
      .select('*')
      .eq('is_active', true)
      .order('building', { ascending: true })
      .order('floor', { ascending: true });

    if (qrCode) {
      query = query.eq('qr_code_hash', qrCode);
    }
    if (building) {
      query = query.eq('building', building);
    }
    if (floor) {
      query = query.eq('floor', floor);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}

