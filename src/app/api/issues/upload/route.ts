import { NextRequest, NextResponse } from 'next/server';
import { issueService } from '@/services/issue.service';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const locationId = (formData.get('location_id') as string) || 'general';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const uploadRes = await issueService.uploadPhoto(locationId, file, extension);

    if (uploadRes.error) {
      return NextResponse.json({ error: uploadRes.error }, { status: 400 });
    }

    return NextResponse.json({ url: uploadRes.data }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to upload photo' },
      { status: 500 }
    );
  }
}
