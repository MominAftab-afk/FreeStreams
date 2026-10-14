export interface PartyMedia {
  tmdbId: number | string;
  type: 'movie' | 'tv';
  title: string;
  backdropPath?: string | null;
  season?: number;
  episode?: number;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  isHost: boolean;
}

export interface PartyRoom {
  roomId: string;
  hostToken: string;
  hostName: string;
  media: PartyMedia;
  server: string;
  status: 'active' | 'ended';
  createdAt: number;
  lastHostHeartbeat: number;
  participantCount: number;
  messages: ChatMessage[];
}

// In-memory global store across hot-reloads and requests
declare global {
  // eslint-disable-next-line no-var
  var __ROSEFLIX_PARTY_STORE__: Map<string, PartyRoom> | undefined;
}

const partyStore: Map<string, PartyRoom> =
  global.__ROSEFLIX_PARTY_STORE__ || new Map<string, PartyRoom>();

if (process.env.NODE_ENV !== 'production') {
  global.__ROSEFLIX_PARTY_STORE__ = partyStore;
}

// Generate human-friendly 8-char room code
function generateRoomCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${result.slice(0, 4)}-${result.slice(4)}`;
}

export function createPartyRoom(media: PartyMedia, hostName: string = 'Host'): PartyRoom {
  const roomId = generateRoomCode();
  const hostToken = `host_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;

  const newRoom: PartyRoom = {
    roomId,
    hostToken,
    hostName: hostName.trim() || 'Host',
    media,
    server: 'server-1',
    status: 'active',
    createdAt: Date.now(),
    lastHostHeartbeat: Date.now(),
    participantCount: 1,
    messages: [
      {
        id: `sys_${Date.now()}`,
        sender: 'RoseFlix Bot',
        text: `Watch party created! Share the link with friends to watch together.`,
        timestamp: Date.now(),
        isHost: false,
      },
    ],
  };

  partyStore.set(roomId, newRoom);
  return newRoom;
}

export function getPartyRoom(roomId: string): PartyRoom | null {
  const room = partyStore.get(roomId);
  if (!room) return null;

  // If host hasn't sent a heartbeat for more than 45 seconds, mark ended
  if (room.status === 'active' && Date.now() - room.lastHostHeartbeat > 45000) {
    room.status = 'ended';
  }

  return room;
}

export function updateHostHeartbeat(roomId: string, hostToken: string): boolean {
  const room = partyStore.get(roomId);
  if (!room || room.hostToken !== hostToken) return false;

  room.lastHostHeartbeat = Date.now();
  if (room.status === 'ended') {
    room.status = 'active';
  }
  return true;
}

export function endPartyRoom(roomId: string, hostToken: string): boolean {
  const room = partyStore.get(roomId);
  if (!room || room.hostToken !== hostToken) return false;

  room.status = 'ended';
  room.messages.push({
    id: `sys_end_${Date.now()}`,
    sender: 'RoseFlix Bot',
    text: `The host has ended this watch party session.`,
    timestamp: Date.now(),
    isHost: false,
  });
  return true;
}

export function addPartyMessage(
  roomId: string,
  sender: string,
  text: string,
  isHost: boolean
): ChatMessage | null {
  const room = partyStore.get(roomId);
  if (!room || room.status === 'ended') return null;

  const msg: ChatMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    sender: sender.trim() || 'Anonymous',
    text: text.trim().slice(0, 300),
    timestamp: Date.now(),
    isHost,
  };

  room.messages.push(msg);
  if (room.messages.length > 80) {
    room.messages.shift(); // keep memory lean
  }
  return msg;
}

export function updatePartyServer(roomId: string, hostToken: string, serverId: string): boolean {
  const room = partyStore.get(roomId);
  if (!room || room.hostToken !== hostToken) return false;
  room.server = serverId;
  return true;
}
