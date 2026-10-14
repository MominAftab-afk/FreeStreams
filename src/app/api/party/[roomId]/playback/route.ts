import { NextRequest, NextResponse } from 'next/server';
import { updatePartyPlayback, getPartyRoom } from '@/lib/partyStore';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const room = getPartyRoom(roomId);

  if (!room || room.status === 'ended') {
    return NextResponse.json({ error: 'Party session is no longer active' }, { status: 400 });
  }

  const hostToken = request.headers.get('x-host-token');
  if (!hostToken || hostToken !== room.hostToken) {
    return NextResponse.json({ error: 'Only the room host can sync playback' }, { status: 401 });
  }

  try {
    const { action, timestamp } = await request.json();

    let updated = false;

    if (action === 'pause') {
      updated = updatePartyPlayback(roomId, hostToken, {
        isPaused: true,
        countdownEnd: null,
      });
    } else if (action === 'resume') {
      // 3-second synchronized countdown
      updated = updatePartyPlayback(roomId, hostToken, {
        isPaused: false,
        countdownEnd: Date.now() + 3200,
      });
    } else if (action === 'timestamp') {
      const rawText = String(timestamp || '').trim();
      let seconds = 0;
      const parts = rawText.split(':').map(Number);
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        seconds = parts[0] * 60 + parts[1];
      } else if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
      } else if (!isNaN(Number(rawText)) && rawText !== '') {
        seconds = Math.max(0, Number(rawText));
      }

      const formattedMinutes = Math.floor(seconds / 60);
      const formattedSeconds = String(seconds % 60).padStart(2, '0');
      const formatted = parts.length >= 2 ? rawText : `${formattedMinutes}:${formattedSeconds}`;

      updated = updatePartyPlayback(roomId, hostToken, {
        timestampSeconds: seconds,
        timestampFormatted: formatted,
      });
    }

    return NextResponse.json({ success: updated, playback: room.playback });
  } catch (err) {
    console.error('Failed to sync playback state:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
