'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Play, Maximize2, Minimize2, Server, AlertCircle, RefreshCw, Sparkles, Loader2, Users } from 'lucide-react';
import { VIDEO_SERVERS, getEmbedUrl } from '@/lib/resolvers';
import { getTMDBImageUrl } from '@/lib/utils';
import { WatchHistoryItem } from '@/components/media/ContinueWatching';
import CreatePartyModal from '@/components/party/CreatePartyModal';

interface VideoPlayerProps {
  tmdbId: number | string;
  type: 'movie' | 'tv';
  title: string;
  backdropPath?: string | null;
  season?: number;
  episode?: number;
}

export default function VideoPlayer({
  tmdbId,
  type,
  title,
  backdropPath,
  season = 1,
  episode = 1,
}: VideoPlayerProps) {
  const [selectedServer, setSelectedServer] = useState<string>('server-1');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);
  const [isLoadingServer, setIsLoadingServer] = useState<boolean>(false);
  const [isPartyModalOpen, setIsPartyModalOpen] = useState<boolean>(false);
  const [iframeKey, setIframeKey] = useState<number>(0);

  // Save to continue watching when playback starts or episode changes
  useEffect(() => {
    if (isPlaying) {
      try {
        const stored = localStorage.getItem('roseflix_continue_watching');
        let list: WatchHistoryItem[] = stored ? JSON.parse(stored) : [];
        list = list.filter((i) => i.id !== tmdbId);
        list.unshift({
          id: tmdbId,
          type,
          title,
          poster: backdropPath || null,
          season: type === 'tv' ? season : undefined,
          episode: type === 'tv' ? episode : undefined,
          timestamp: Date.now(),
        });
        localStorage.setItem('roseflix_continue_watching', JSON.stringify(list.slice(0, 12)));
      } catch (err) {
        console.error('Failed to update continue watching:', err);
      }
    }
  }, [isPlaying, tmdbId, type, title, backdropPath, season, episode]);

  const embedUrl = getEmbedUrl(selectedServer, type, tmdbId, season, episode);

  const handleStartPlay = () => {
    // Check if ads/popunder is enabled
    const adsEnabled = process.env.NEXT_PUBLIC_ENABLE_ADS === 'true';
    const directLink = process.env.NEXT_PUBLIC_DIRECT_LINK_URL;

    if (adsEnabled && directLink) {
      const lastPop = localStorage.getItem('roseflix_last_pop');
      const now = Date.now();
      // 45 minute frequency cap
      if (!lastPop || now - parseInt(lastPop, 10) > 45 * 60 * 1000) {
        localStorage.setItem('roseflix_last_pop', now.toString());
        window.open(directLink, '_blank');
      }
    }

    setIsPlaying(true);
  };

  const handleServerChange = (serverId: string) => {
    if (serverId === selectedServer) return;
    setIsLoadingServer(true);
    setSelectedServer(serverId);
    setIframeKey((prev) => prev + 1);
    setIsPlaying(true); // Automatically keep playing on new server

    // Brief loader reset
    setTimeout(() => {
      setIsLoadingServer(false);
    }, 600);
  };

  return (
    <div className={`relative transition-all duration-300 ${isTheaterMode ? 'w-full max-w-full' : 'w-full'}`}>
      {/* Server Switcher & Watch Together Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 p-3 rounded-xl bg-[#111116] border border-white/5">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-[#FF1E56]" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Available Servers:
          </span>
        </div>

        {/* Server buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {VIDEO_SERVERS.map((server) => {
            const isActive = selectedServer === server.id;
            return (
              <button
                key={server.id}
                onClick={() => handleServerChange(server.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#FF1E56] text-white shadow-[0_0_15px_rgba(255,30,86,0.6)] font-semibold scale-102'
                    : 'bg-[#181824] text-slate-300 hover:text-white hover:bg-[#202030] border border-white/5'
                }`}
              >
                <span>{server.name}</span>
              </button>
            );
          })}
        </div>

        {/* Right side controls: Watch Together + Theater Mode */}
        <div className="flex items-center gap-2">
          {/* Watch Together Trigger */}
          <button
            onClick={() => setIsPartyModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-[#FF1E56] to-[#D90429] hover:from-[#FF007F] hover:to-[#FF1E56] shadow-[0_0_15px_rgba(255,30,86,0.5)] hover:scale-102 transition-all cursor-pointer"
            title="Watch together with friends (Temporary link, no login required)"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Watch Together</span>
          </button>

          {/* Theater Mode Toggle */}
          <button
            onClick={() => setIsTheaterMode(!isTheaterMode)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-[#1a1a24] hover:bg-white/10 transition-colors cursor-pointer"
            title="Toggle Theater Mode"
          >
            {isTheaterMode ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-[#FF1E56]" />
                <span>Standard</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-[#FF1E56]" />
                <span>Theater Mode</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Video Frame / Poster Container */}
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10">
        {isLoadingServer && (
          <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-8 h-8 text-[#FF1E56] animate-spin" />
            <p className="text-xs font-semibold text-slate-300">Switching server stream...</p>
          </div>
        )}

        {!isPlaying ? (
          /* Sleek Black & Pink Poster Overlay (Pre-Play) */
          <div
            onClick={handleStartPlay}
            className="relative w-full h-full flex items-center justify-center cursor-pointer group"
          >
            {backdropPath && (
              <Image
                src={getTMDBImageUrl(backdropPath, 'original')}
                alt={title}
                fill
                priority
                className="object-cover filter brightness-[0.55] transition-transform duration-700 group-hover:scale-102"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

            {/* Glowing Play CTA */}
            <div className="relative z-10 flex flex-col items-center text-center p-6 space-y-4">
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-[#FF1E56] to-[#D90429] flex items-center justify-center text-white shadow-[0_0_35px_rgba(255,30,86,0.8)] group-hover:shadow-[0_0_55px_rgba(255,30,86,1)] group-hover:scale-110 active:scale-95 transition-all duration-300"
                aria-label="Click to start streaming"
              >
                <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-white ml-1.5 transition-transform" />
              </div>

              <div className="space-y-1">
                <p className="text-white font-bold text-lg sm:text-xl drop-shadow">
                  Click to Stream Now
                </p>
                <p className="text-xs sm:text-sm text-[#FF85A1] font-medium flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Multi-server redundancy enabled • 1080p HD
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Active Embed Player */
          <iframe
            key={iframeKey}
            src={embedUrl}
            title={title}
            className="w-full h-full border-0"
            referrerPolicy="origin"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          />
        )}
      </div>

      {/* Troubleshooting bar */}
      <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400 px-2">
        <div className="flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Buffering or server down? Switch to another server tab above for instant fallback.</span>
        </div>
        {isPlaying && (
          <button
            onClick={() => setIframeKey((k) => k + 1)}
            className="flex items-center gap-1 text-[#FF85A1] hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            Reload Player
          </button>
        )}
      </div>

      {/* Watch Together Modal */}
      <CreatePartyModal
        isOpen={isPartyModalOpen}
        onClose={() => setIsPartyModalOpen(false)}
        media={{
          tmdbId,
          type,
          title,
          backdropPath,
          season,
          episode,
        }}
      />
    </div>
  );
}
