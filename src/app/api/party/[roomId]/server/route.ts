import { NextRequest, NextResponse } from 'next/server';
import { updatePartyServer } from '@/lib/partyStore';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const hostToken = request.headers.get('x-host-token');

  if (!hostToken) {
    return NextResponse.json({ error: 'Only the room creator can switch stream servers' }, { status: 401 });
  }

  try {
    const { serverId } = await request.json();
    if (!serverId) {
      return NextResponse.json({ error: 'Missing serverId' }, { status: 400 });
    }

    const updated = updatePartyServer(roomId, hostToken, serverId);
    return NextResponse.json({ success: updated });
  } catch (error) {
    console.error('Failed to update party server:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
