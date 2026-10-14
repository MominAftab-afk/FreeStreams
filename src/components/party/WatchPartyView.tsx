'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Copy,
  Check,
  Send,
  Crown,
  AlertTriangle,
  LogOut,
  MessageSquare,
  ShieldAlert,
  Zap,
  Pause,
  Play,
  Clock,
  RotateCcw,
  Sliders,
} from 'lucide-react';
import { VIDEO_SERVERS, getEmbedUrl } from '@/lib/resolvers';
import { PartyMedia, ChatMessage, PartyPlaybackState } from '@/lib/partyStore';

interface WatchPartyViewProps {
  roomId: string;
}

interface RoomState {
  roomId: string;
  hostName: string;
  media: PartyMedia;
  server: string;
  status: 'active' | 'ended';
  participantCount: number;
  messages: ChatMessage[];
  playback?: PartyPlaybackState;
  isHost?: boolean;
}

export default function WatchPartyView({ roomId }: WatchPartyViewProps) {
  const router = useRouter();

  const [roomData, setRoomData] = useState<RoomState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [hostToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(`roseflix_party_host_${roomId}`);
    }
    return null;
  });

  const [myNickname, setMyNickname] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('roseflix_party_name');
      if (saved) return saved;
      const token = sessionStorage.getItem(`roseflix_party_host_${roomId}`);
      if (token) return 'Host';
      const randomGuest = `Guest_${Math.floor(100 + Math.random() * 900)}`;
      sessionStorage.setItem('roseflix_party_name', randomGuest);
      return randomGuest;
    }
    return 'Guest';
  });

  const [inputMessage, setInputMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Playback sync controls
  const [timestampInput, setTimestampInput] = useState('');
  const [isSyncingPlayback, setIsSyncingPlayback] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const lastSyncedTimeRef = useRef<number | undefined>(undefined);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Real-Time Server-Sent Events (SSE) Stream Subscription
  useEffect(() => {
    let isMounted = true;
    const currentToken =
      hostToken ||
      (typeof window !== 'undefined'
        ? sessionStorage.getItem(`roseflix_party_host_${roomId}`)
        : null);

    const streamUrl = `/api/party/${roomId}/stream${
      currentToken ? `?token=${encodeURIComponent(currentToken)}` : ''
    }`;

    const eventSource = new EventSource(streamUrl);

    eventSource.onopen = () => {
      if (isMounted) {
        setIsLiveConnected(true);
      }
    };

    eventSource.onmessage = (event) => {
      if (!isMounted) return;
      try {
        const data = JSON.parse(event.data);
        setRoomData(data);
        setLoading(false);

        if (data.status === 'ended') {
          setError('This temporary watch party has ended.');
        }

        // Detect if timestamp was synced to reload the iframe at the new timestamp
        if (
          data.playback?.timestampSeconds !== undefined &&
          data.playback.timestampSeconds > 0 &&
          data.playback.timestampSeconds !== lastSyncedTimeRef.current
        ) {
          lastSyncedTimeRef.current = data.playback.timestampSeconds;
          setIframeKey((k) => k + 1);
        }
      } catch (err) {
        console.error('Error parsing SSE room update:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn('Watch party SSE connection status:', err);
      if (eventSource.readyState === EventSource.CLOSED) {
        if (isMounted) {
          setError((prev) => prev || 'This temporary watch party has expired or does not exist.');
          setLoading(false);
        }
        setIsLiveConnected(false);
      }
    };

    return () => {
      isMounted = false;
      eventSource.close();
    };
  }, [roomId, hostToken]);

  // Synchronized Countdown Timer (e.g. 3.. 2.. 1.. Play)
  const [now, setNow] = useState<number>(() => Date.now());
  const countdownEnd = roomData?.playback?.countdownEnd;
  const countdownSeconds =
    countdownEnd && countdownEnd > now
      ? Math.ceil((countdownEnd - now) / 1000)
      : null;

  useEffect(() => {
    if (!countdownEnd || countdownEnd <= Date.now()) return;

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 100);

    return () => clearInterval(timer);
  }, [countdownEnd]);

  // Host browser tab close / leave protection
  useEffect(() => {
    const isHost = Boolean(hostToken || sessionStorage.getItem(`roseflix_party_host_${roomId}`));
    if (!isHost) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'If you leave, this Watch Party session will end for everyone.';
      return 'If you leave, this Watch Party session will end for everyone.';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hostToken, roomId]);

  // Auto-scroll chat when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [roomData?.messages]);

  // Copy invite link with fallback for insecure origins (HTTP LAN IPs)
  const copyInviteLink = async () => {
    if (typeof window === 'undefined') return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(window.location.href);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = window.location.href;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy invite link:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isSendingMessage) return;

    const text = inputMessage.trim();
    setInputMessage('');
    setIsSendingMessage(true);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const currentToken = hostToken || sessionStorage.getItem(`roseflix_party_host_${roomId}`);
      if (currentToken) {
        headers['x-host-token'] = currentToken;
      }

      await fetch(`/api/party/${roomId}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          sender: myNickname,
          text,
        }),
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Playback Control Actions
  const handleTogglePause = async () => {
    const currentToken = hostToken || sessionStorage.getItem(`roseflix_party_host_${roomId}`);
    if (!currentToken || isSyncingPlayback) return;

    setIsSyncingPlayback(true);
    const isCurrentlyPaused = roomData?.playback?.isPaused;
    const action = isCurrentlyPaused ? 'resume' : 'pause';

    try {
      await fetch(`/api/party/${roomId}/playback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-host-token': currentToken,
        },
        body: JSON.stringify({ action }),
      });
    } catch (err) {
      console.error('Failed to toggle pause/resume:', err);
    } finally {
      setIsSyncingPlayback(false);
    }
  };

  const handleSyncTimestamp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const currentToken = hostToken || sessionStorage.getItem(`roseflix_party_host_${roomId}`);
    if (!currentToken || !timestampInput.trim() || isSyncingPlayback) return;

    setIsSyncingPlayback(true);
    try {
      await fetch(`/api/party/${roomId}/playback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-host-token': currentToken,
        },
        body: JSON.stringify({
          action: 'timestamp',
          timestamp: timestampInput.trim(),
        }),
      });
      setTimestampInput('');
    } catch (err) {
      console.error('Failed to sync timestamp:', err);
    } finally {
      setIsSyncingPlayback(false);
    }
  };

  const handleHostConfirmEnd = async () => {
    try {
      const currentToken = hostToken || sessionStorage.getItem(`roseflix_party_host_${roomId}`);
      if (currentToken) {
        await fetch(`/api/party/${roomId}`, {
          method: 'DELETE',
          headers: { 'x-host-token': currentToken },
        });
      }
    } catch (err) {
      console.error(err);
    }
    sessionStorage.removeItem(`roseflix_party_host_${roomId}`);
    setShowLeaveModal(false);
    router.push('/');
  };

  const handleServerChange = async (newServer: string) => {
    const currentToken = hostToken || sessionStorage.getItem(`roseflix_party_host_${roomId}`);
    if (!currentToken || !roomData) return;

    try {
      setRoomData((prev) => (prev ? { ...prev, server: newServer } : prev));

      await fetch(`/api/party/${roomId}/server`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-host-token': currentToken,
        },
        body: JSON.stringify({ serverId: newServer }),
      });
    } catch (err) {
      console.error('Failed to change server:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-28 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-[#FF1E56] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-300">Connecting to real-time party stream...</p>
      </div>
    );
  }

  if (error || !roomData) {
    return (
      <div className="min-h-screen pt-28 max-w-lg mx-auto px-4 text-center">
        <div className="p-8 rounded-2xl bg-[#0e0e13] border border-white/10 space-y-4 shadow-2xl">
          <AlertTriangle className="w-12 h-12 text-[#FF1E56] mx-auto" />
          <h2 className="text-xl font-bold text-white">Watch Party Not Available</h2>
          <p className="text-sm text-slate-400">
            {error || 'This session has expired or the link is invalid.'}
          </p>
          <Link
            href="/"
            className="inline-block mt-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#FF1E56] hover:bg-[#FF007F] shadow-lg transition-all"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const { media, status, server: activeServer, messages, participantCount, playback } = roomData;
  const isHost = Boolean(hostToken || roomData.isHost);
  const isMovie = media.type === 'movie';
  const soloWatchUrl = isMovie
    ? `/watch/movie/${media.tmdbId}`
    : `/watch/tv/${media.tmdbId}?s=${media.season || 1}&e=${media.episode || 1}`;

  const currentEmbedUrl = getEmbedUrl(
    activeServer,
    media.type,
    media.tmdbId,
    media.season || 1,
    media.episode || 1,
    playback?.timestampSeconds
  );

  const isPaused = Boolean(playback?.isPaused);
  const isCountingDown = typeof countdownSeconds === 'number' && countdownSeconds > 0;

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Top Session Status Bar */}
      <div className="mb-4 p-3.5 sm:p-4 rounded-2xl bg-[#0e0e13] border border-white/10 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Room ID Badge */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#161622] border border-[#FF1E56]/30 text-xs font-semibold text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Room: {roomId}</span>
          </div>

          {/* SSE Real-Time Status Badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
              isLiveConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>{isLiveConnected ? 'SSE Live' : 'Connecting...'}</span>
          </div>

          {/* Participant Counter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <Users className="w-4 h-4 text-[#FF1E56]" />
            <span>
              {participantCount} {participantCount === 1 ? 'viewer' : 'viewers'}
            </span>
          </div>

          {/* Host or Guest Identity */}
          {isHost ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase px-2 py-0.5 rounded-md bg-[#FF1E56] text-white shadow-sm">
              <Crown className="w-3 h-3 fill-white" />
              Room Host
            </span>
          ) : (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white/10 text-slate-300">
              Host: {roomData.hostName}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={copyInviteLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#181824] hover:bg-[#222232] text-white border border-white/10 hover:border-[#FF1E56]/50 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#FF85A1]" />
                <span>Share Link</span>
              </>
            )}
          </button>

          {isHost ? (
            <button
              onClick={() => setShowLeaveModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              End Session
            </button>
          ) : (
            <Link
              href={soloWatchUrl}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
            >
              Watch Solo
            </Link>
          )}
        </div>
      </div>

      {/* Main Grid: Video Player + Live Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Synchronized Video Player */}
        <div className="lg:col-span-3 space-y-3.5">
          {/* Host Sync Control Bar */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-[#12121c] via-[#161624] to-[#12121c] border border-white/10 shadow-xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#FF1E56]/20 border border-[#FF1E56]/40 flex items-center justify-center text-[#FF1E56]">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {isHost ? 'Host Sync Controls' : 'Room Synchronization'}
                </span>
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isPaused ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                    }`}
                  />
                  {isPaused ? 'Stream Paused by Host' : 'Stream Active'}
                  {playback?.timestampFormatted && (
                    <span className="text-[#FF85A1] text-[11px] font-mono ml-1 px-1.5 py-0.5 rounded bg-white/5">
                      ⏱️ {playback.timestampFormatted}
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Host Controls */}
            {isHost ? (
              <div className="flex flex-wrap items-center gap-2">
                {/* Pause / Resume Button */}
                <button
                  onClick={handleTogglePause}
                  disabled={isSyncingPlayback}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer ${
                    isPaused
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-emerald-500/30'
                      : 'bg-gradient-to-r from-[#FF1E56] to-[#D90429] hover:from-[#FF007F] hover:to-[#FF1E56] text-white shadow-[#FF1E56]/30'
                  }`}
                  title={isPaused ? 'Resume with 3-second countdown' : 'Pause for everyone'}
                >
                  {isPaused ? (
                    <>
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Resume Party (3s Countdown)</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-white" />
                      <span>Pause for Everyone</span>
                    </>
                  )}
                </button>

                {/* Timestamp Jump Input & Button */}
                <form onSubmit={handleSyncTimestamp} className="flex items-center gap-1.5">
                  <div className="relative">
                    <Clock className="w-3.5 h-3.5 text-[#FF85A1] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={timestampInput}
                      onChange={(e) => setTimestampInput(e.target.value)}
                      placeholder="e.g. 24:15"
                      className="w-24 pl-7 pr-2 py-1.5 rounded-xl bg-[#1a1a28] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#FF1E56] font-mono"
                      title="Enter mm:ss or timestamp to synchronize viewers"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!timestampInput.trim() || isSyncingPlayback}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#222232] hover:bg-[#2b2b3f] text-slate-200 hover:text-white border border-white/10 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    Sync Time
                  </button>
                </form>
              </div>
            ) : (
              /* Guest Sync Status & Manual Jump Button */
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 italic">
                  {isPaused ? 'Waiting for host to resume...' : 'Synchronized with host'}
                </span>
                {playback?.timestampFormatted && (
                  <button
                    onClick={() => setIframeKey((k) => k + 1)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/10 hover:bg-white/15 text-[#FF85A1] transition-colors cursor-pointer"
                    title="Reload player at host timestamp"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Sync to {playback.timestampFormatted}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Server Switcher Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-xl bg-[#111116] border border-white/5 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                Stream Server:
              </span>
              <span className="text-[#FF85A1] font-bold">
                {VIDEO_SERVERS.find((s) => s.id === activeServer)?.name || activeServer}
              </span>
            </div>

            {isHost ? (
              <div className="flex items-center gap-1.5">
                {VIDEO_SERVERS.slice(0, 3).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleServerChange(s.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                      activeServer === s.id
                        ? 'bg-[#FF1E56] text-white shadow-sm'
                        : 'bg-[#1a1a24] text-slate-400 hover:text-white'
                    }`}
                  >
                    {s.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-[11px] text-slate-500 italic">
                Server chosen by host
              </span>
            )}
          </div>

          {/* Embed Video Player Frame with Synchronized Overlays */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10">
            {/* 1. ROOM ENDED OVERLAY */}
            {status === 'ended' && (
              <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shadow-xl">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    Watch Party Ended
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 max-w-md">
                    The creator of the link has left the session. As designed, this temporary watch room has now expired.
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Link
                    href={soloWatchUrl}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#FF1E56] hover:bg-[#FF007F] shadow-[0_0_15px_rgba(255,30,86,0.6)] transition-all"
                  >
                    Continue Watching Solo
                  </Link>
                  <Link
                    href="/"
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-[#1a1a24] border border-white/10 transition-colors"
                  >
                    Back to Home
                  </Link>
                </div>
              </div>
            )}

            {/* 2. SYNCHRONIZED COUNTDOWN OVERLAY (3... 2... 1... PLAY!) */}
            {isCountingDown && (
              <div className="absolute inset-0 z-35 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-[#FF1E56]/30 via-white/10 to-[#FF85A1]/30 border-2 border-[#FF1E56] flex items-center justify-center shadow-[0_0_40px_rgba(255,30,86,0.9)] animate-pulse">
                  <span className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-[#FF85A1]">
                    {countdownSeconds}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-bold text-white tracking-wide">
                    Resuming Stream in {countdownSeconds}...
                  </p>
                  <p className="text-xs text-[#FF85A1] font-semibold">
                    All party viewers synchronized
                  </p>
                </div>
              </div>
            )}

            {/* 3. SYNCHRONIZED PAUSE OVERLAY */}
            {isPaused && !isCountingDown && (
              <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#FF1E56]/15 border border-[#FF1E56]/40 flex items-center justify-center text-[#FF1E56] shadow-[0_0_30px_rgba(255,30,86,0.7)] animate-pulse">
                  <Pause className="w-8 h-8 fill-[#FF1E56]" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Session Paused by Host
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-md">
                    {isHost
                      ? 'You have paused the room. Click Resume Party to initiate a 3-second synchronized countdown for all viewers.'
                      : 'The host has paused the session. Grab popcorn — the stream will resume once the host unpauses.'}
                  </p>
                  {playback?.timestampFormatted && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-mono text-[#FF85A1] mt-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Paused at {playback.timestampFormatted}</span>
                    </div>
                  )}
                </div>

                {isHost && (
                  <button
                    onClick={handleTogglePause}
                    disabled={isSyncingPlayback}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Resume Party (3s Countdown)</span>
                  </button>
                )}
              </div>
            )}

            {/* Active Video Embed */}
            <iframe
              key={iframeKey}
              src={currentEmbedUrl}
              title={media.title}
              className="w-full h-full border-0"
              referrerPolicy="origin"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            />
          </div>

          {/* Media Info Panel */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0e0e13] border border-white/5 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FF1E56] text-white">
                  {isMovie ? 'Movie' : `S${media.season} E${media.episode}`}
                </span>
                <span className="text-xs text-[#FF85A1] font-semibold">Real-Time Sync</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">{media.title}</h2>
            </div>
            <Link
              href={soloWatchUrl}
              className="text-xs text-slate-400 hover:text-white shrink-0 hover:underline"
            >
              View Full Details &rarr;
            </Link>
          </div>
        </div>

        {/* Right Column: Instant Live Chat */}
        <div className="lg:col-span-1 flex flex-col h-[560px] rounded-2xl bg-[#0e0e13] border border-white/10 overflow-hidden shadow-2xl">
          {/* Chat Header */}
          <div className="p-3.5 border-b border-white/10 bg-[#12121a] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#FF1E56]" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Party Chat</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">You:</span>
              <input
                type="text"
                value={myNickname}
                maxLength={18}
                onChange={(e) => {
                  setMyNickname(e.target.value);
                  sessionStorage.setItem('roseflix_party_name', e.target.value);
                }}
                className="w-20 px-1.5 py-0.5 rounded bg-[#1a1a26] text-white text-[11px] font-semibold border border-white/10 focus:outline-none focus:border-[#FF1E56]"
                title="Click to edit nickname"
              />
            </div>
          </div>

          {/* Chat Messages Log */}
          <div
            ref={chatContainerRef}
            className="flex-1 p-3.5 overflow-y-auto space-y-2.5 text-xs divide-y divide-white/5"
          >
            {messages.map((msg) => (
              <div key={msg.id} className="pt-2 first:pt-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="font-bold flex items-center gap-1 text-[#FF85A1]">
                    {msg.isHost && <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />}
                    {msg.sender}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-200 leading-relaxed break-words">{msg.text}</p>
              </div>
            ))}
          </div>

          {/* Chat Input Box */}
          <form
            onSubmit={handleSendMessage}
            className="p-2.5 border-t border-white/10 bg-[#12121a] flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              disabled={status === 'ended'}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={status === 'ended' ? 'Session ended' : 'Type a message...'}
              className="flex-1 px-3 py-2 rounded-xl bg-[#1a1a26] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#FF1E56] transition-colors"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || status === 'ended'}
              className="p-2 rounded-xl bg-[#FF1E56] hover:bg-[#FF007F] text-white disabled:opacity-40 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Host Leaving Warning Popup Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#0e0e13] border border-red-500/40 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-white">Leaving will end the session!</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                As the <strong className="text-[#FF85A1]">creator & host</strong> of this temporary watch party, leaving or ending the session will immediately expire the link and disconnect all friends who are watching with you.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-[#1a1a24] hover:bg-[#252535] text-white border border-white/10 transition-colors"
              >
                Stay in Watch Party
              </button>
              <button
                onClick={handleHostConfirmEnd}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-[#FF1E56] hover:from-red-500 hover:to-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all cursor-pointer"
              >
                End for Everyone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
