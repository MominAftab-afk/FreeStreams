import { NextRequest, NextResponse } from 'next/server';
import { addPartyMessage, getPartyRoom } from '@/lib/partyStore';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const room = getPartyRoom(roomId);

  if (!room || room.status === 'ended') {
    return NextResponse.json({ error: 'Party session is no longer active' }, { status: 400 });
  }

  try {
    const { sender, text } = await request.json();
    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    const hostToken = request.headers.get('x-host-token');
    const isHost = Boolean(hostToken && hostToken === room.hostToken);

    const message = addPartyMessage(roomId, sender || 'Anonymous', text, isHost);

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('Failed to post party message:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
