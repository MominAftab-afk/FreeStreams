import { NextRequest, NextResponse } from 'next/server';
import { updateHostHeartbeat } from '@/lib/partyStore';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const hostToken = request.headers.get('x-host-token');

  if (!hostToken) {
    return NextResponse.json({ error: 'Missing host token' }, { status: 401 });
  }

  const updated = updateHostHeartbeat(roomId, hostToken);
  return NextResponse.json({ success: updated });
}
