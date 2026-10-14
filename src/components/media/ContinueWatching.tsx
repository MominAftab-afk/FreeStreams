'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Clock, X } from 'lucide-react';
import { getTMDBImageUrl } from '@/lib/utils';

export interface WatchHistoryItem {
  id: number | string;
  type: 'movie' | 'tv';
  title: string;
  poster: string | null;
  season?: number;
  episode?: number;
  timestamp: number;
}

export default function ContinueWatching() {
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('mateflix_continue_watching');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load continue watching history:', e);
    }
  }, []);

  const removeItem = (id: number | string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    try {
      localStorage.setItem('mateflix_continue_watching', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  if (!history || history.length === 0) return null;

  return (
    <section className="my-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-2.5 mb-4">
        <Clock className="w-5 h-5 text-[#FF1E56]" />
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          Continue Watching
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {history.map((item) => {
          const watchHref =
            item.type === 'movie'
              ? `/watch/movie/${item.id}`
              : `/watch/tv/${item.id}?s=${item.season || 1}&e=${item.episode || 1}`;

          return (
            <div
              key={`${item.type}-${item.id}`}
              className="group/continue relative rounded-xl overflow-hidden bg-[#111116] border border-white/5 hover:border-[#FF1E56]/40 transition-all hover:-translate-y-1"
            >
              <Link href={watchHref} className="block relative aspect-[2/3] w-full">
                <Image
                  src={getTMDBImageUrl(item.poster, 'w500')}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  className="object-cover group-hover/continue:scale-105 transition-transform duration-300"
                />

                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                  <div className="h-full bg-[#FF1E56] w-2/3 shadow-[0_0_8px_rgba(255,30,86,0.8)]" />
                </div>

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/continue:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-[#FF1E56] text-white flex items-center justify-center shadow-lg">
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  </div>
                </div>
              </Link>

              {/* Remove Button */}
              <button
                onClick={(e) => removeItem(item.id, e)}
                className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-slate-400 hover:text-white transition-colors z-10"
                title="Remove from Continue Watching"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="p-2.5 bg-[#0e0e13]">
                <h4 className="text-xs font-semibold text-white truncate">{item.title}</h4>
                <p className="text-[11px] text-[#FF85A1] mt-0.5">
                  {item.type === 'movie'
                    ? 'Resume Movie'
                    : `S${item.season || 1} : E${item.episode || 1}`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
