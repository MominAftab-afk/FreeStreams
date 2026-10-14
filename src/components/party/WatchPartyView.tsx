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
  RefreshCw,
  Film,
  Tv,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import { VIDEO_SERVERS, getEmbedUrl } from '@/lib/resolvers';
import { PartyMedia, ChatMessage } from '@/lib/partyStore';

interface WatchPartyViewProps {
  roomId: string;
}

export default function WatchPartyView({ roomId }: WatchPartyViewProps) {
  const router = useRouter();

  const [roomData, setRoomData] = useState<{
    hostName: string;
    media: PartyMedia;
    server: string;
    status: 'active' | 'ended';
    participantCount: number;
    messages: ChatMessage[];
    isHost: boolean;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hostToken, setHostToken] = useState<string | null>(null);
  const [myNickname, setMyNickname] = useState<string>('Guest');
  const [inputMessage, setInputMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Initialize identity from sessionStorage
  useEffect(() => {
    const savedToken = sessionStorage.getItem(`roseflix_party_host_${roomId}`);
    if (savedToken) {
      setHostToken(savedToken);
    }
    const savedName = sessionStorage.getItem('roseflix_party_name');
    if (savedName) {
      setMyNickname(savedName);
    } else if (savedToken) {
      setMyNickname('Host');
    } else {
      const randomGuest = `Guest_${Math.floor(100 + Math.random() * 900)}`;
      setMyNickname(randomGuest);
      sessionStorage.setItem('roseflix_party_name', randomGuest);
    }
  }, [roomId]);

  // Polling & Heartbeat loop
  useEffect(() => {
    let isMounted = true;

    async function fetchStatus() {
      try {
        const headers: Record<string, string> = {};
        const currentToken = hostToken || sessionStorage.getItem(`roseflix_party_host_${roomId}`);
        if (currentToken) {
          headers['x-host-token'] = currentToken;
        }

        const res = await fetch(`/api/party/${roomId}`, { headers });
        if (!res.ok) {
          if (res.status === 404) {
            setError('This temporary watch party has expired or does not exist.');
            setLoading(false);
            return;
          }
          throw new Error('Failed to fetch room status');
        }

        const data = await res.json();
        if (isMounted) {
          setRoomData(data);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Watch party sync error:', err);
      }
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [roomId, hostToken]);

  // Host browser tab close / leave protection
  useEffect(() => {
    const isHost = Boolean(hostToken || sessionStorage.getItem(`roseflix_party_host_${roomId}`));
    if (!isHost) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Modern browser prompt for page unload
      e.preventDefault();
      e.returnValue = 'If you leave, this Watch Party session will end for everyone.';
      return 'If you leave, this Watch Party session will end for everyone.';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hostToken, roomId]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [roomData?.messages]);

  const copyInviteLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
      if (hostToken) {
        headers['x-host-token'] = hostToken;
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

  const handleHostConfirmEnd = async () => {
    try {
      if (hostToken) {
        await fetch(`/api/party/${roomId}`, {
          method: 'DELETE',
          headers: { 'x-host-token': hostToken },
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
    if (!hostToken || !roomData) return;
    try {
      await fetch(`/api/party/${roomId}/server`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-host-token': hostToken,
        },
        body: JSON.stringify({ serverId: newServer }),
      });
      setRoomData({ ...roomData, server: newServer });
    } catch (err) {
      console.error('Failed to change server:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-28 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-[#FF1E56] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-300">Connecting to Watch Party...</p>
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

  const { media, status, isHost, server: activeServer, messages } = roomData;
  const isMovie = media.type === 'movie';
  const soloWatchUrl = isMovie
    ? `/watch/movie/${media.tmdbId}`
    : `/watch/tv/${media.tmdbId}?s=${media.season || 1}&e=${media.episode || 1}`;

  const currentEmbedUrl = getEmbedUrl(
    activeServer,
    media.type,
    media.tmdbId,
    media.season || 1,
    media.episode || 1
  );

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Top Session Status Bar */}
      <div className="mb-4 p-3.5 sm:p-4 rounded-2xl bg-[#0e0e13] border border-white/10 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#161622] border border-[#FF1E56]/30 text-xs font-semibold text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Room: {roomId}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <Users className="w-4 h-4 text-[#FF1E56]" />
            <span>Watching with friends</span>
          </div>

          {isHost ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase px-2 py-0.5 rounded-md bg-[#FF1E56] text-white shadow-sm">
              <Crown className="w-3 h-3 fill-white" />
              Room Creator (Host)
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
        <div className="lg:col-span-3 space-y-4">
          {/* Server Switcher (Host-controlled sync) */}
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
                Synchronized by host
              </span>
            )}
          </div>

          {/* Embed Video Player Frame */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10">
            {/* If Room is Ended, Show Overlay */}
            {status === 'ended' ? (
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
            ) : (
              <iframe
                src={currentEmbedUrl}
                title={media.title}
                className="w-full h-full border-0"
                referrerPolicy="origin"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              />
            )}
          </div>

          {/* Media Info Panel */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0e0e13] border border-white/5 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FF1E56] text-white">
                  {isMovie ? 'Movie' : `S${media.season} E${media.episode}`}
                </span>
                <span className="text-xs text-[#FF85A1] font-semibold">Watch Party Sync</span>
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

        {/* Right Column: Live Chat & Reactions */}
        <div className="lg:col-span-1 flex flex-col h-[520px] rounded-2xl bg-[#0e0e13] border border-white/10 overflow-hidden shadow-2xl">
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
