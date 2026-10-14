import { NextRequest, NextResponse } from 'next/server';
import { getPartyRoom, updateHostHeartbeat, endPartyRoom } from '@/lib/partyStore';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const room = getPartyRoom(roomId);

  if (!room) {
    return NextResponse.json({ error: 'Party room not found or expired' }, { status: 404 });
  }

  // Check if request is from host to update heartbeat
  const hostToken = request.headers.get('x-host-token');
  const isHost = Boolean(hostToken && hostToken === room.hostToken);

  if (isHost) {
    updateHostHeartbeat(roomId, hostToken!);
  }

  return NextResponse.json({
    roomId: room.roomId,
    hostName: room.hostName,
    media: room.media,
    server: room.server,
    status: room.status,
    createdAt: room.createdAt,
    participantCount: room.participantCount,
    messages: room.messages,
    isHost,
  });
}

// Host ends the room
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const hostToken = request.headers.get('x-host-token');

  if (!hostToken) {
    return NextResponse.json({ error: 'Unauthorized: host token required' }, { status: 401 });
  }

  const ended = endPartyRoom(roomId, hostToken);
  if (!ended) {
    return NextResponse.json({ error: 'Failed to end party room or invalid token' }, { status: 400 });
  }

  return NextResponse.json({ success: true, status: 'ended' });
}
