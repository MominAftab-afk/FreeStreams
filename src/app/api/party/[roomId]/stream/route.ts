import { NextRequest } from 'next/server';
import {
  getPartyRoom,
  subscribeToRoom,
  unsubscribeFromRoom,
  formatRoomState,
  incrementParticipants,
  decrementParticipants,
  updateHostHeartbeat,
  PartyRoom,
} from '@/lib/partyStore';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const room = getPartyRoom(roomId);

  if (!room || room.status === 'ended') {
    return new Response(JSON.stringify({ error: 'Party room not found or has ended' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const hostToken = request.nextUrl.searchParams.get('token') || request.headers.get('x-host-token');
  const isHost = Boolean(hostToken && hostToken === room.hostToken);

  const encoder = new TextEncoder();
  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // 1. Immediately send current room state on connection
      const initialPayload = formatRoomState(room, isHost);
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialPayload)}\n\n`));

      // 2. Increment active participant counter
      incrementParticipants(roomId, isHost);

      // 3. Listener callback for instantaneous state pushes
      const onRoomUpdate = (updatedRoom: PartyRoom) => {
        try {
          const payload = formatRoomState(updatedRoom, isHost);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
          if (updatedRoom.status === 'ended') {
            setTimeout(() => {
              try {
                controller.close();
              } catch {}
            }, 1000);
          }
        } catch (err) {
          console.error('Error writing to SSE stream:', err);
        }
      };

      subscribeToRoom(roomId, onRoomUpdate);

      // 4. Heartbeat ping every 15s to prevent browser/proxy timeouts
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
          if (isHost && hostToken) {
            updateHostHeartbeat(roomId, hostToken);
          }
        } catch {
          // Stream might already be closed
        }
      }, 15000);

      cleanup = () => {
        clearInterval(pingInterval);
        unsubscribeFromRoom(roomId, onRoomUpdate);
        decrementParticipants(roomId, isHost);
        try {
          controller.close();
        } catch {}
      };
    },
    cancel() {
      if (cleanup) {
        cleanup();
        cleanup = null;
      }
    },
  });

  request.signal.addEventListener('abort', () => {
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Content-Encoding': 'none',
      'X-Accel-Buffering': 'no',
    },
  });
}
