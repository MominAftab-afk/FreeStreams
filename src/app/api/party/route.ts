import { NextRequest, NextResponse } from 'next/server';
import { createPartyRoom } from '@/lib/partyStore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { media, hostName } = body;

    if (!media || !media.tmdbId || !media.type || !media.title) {
      return NextResponse.json({ error: 'Missing media metadata' }, { status: 400 });
    }

    const room = createPartyRoom(media, hostName);

    return NextResponse.json({
      success: true,
      roomId: room.roomId,
      hostToken: room.hostToken,
      room,
    });
  } catch (error) {
    console.error('Failed to create party room:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
