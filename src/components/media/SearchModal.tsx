'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, X, Film, Tv, Star, Loader2 } from 'lucide-react';
import { MediaItem } from '@/types/tmdb';
import { getTMDBImageUrl, formatYear, formatRating } from '@/lib/utils';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results?.slice(0, 8) || []);
        }
      } catch (err) {
        console.error('Search fetch failed:', err);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => clearTimeout(timeoutId);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-md transition-opacity">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Box */}
      <div className="relative w-full max-w-2xl bg-[#0e0e13] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/10 bg-[#111116]">
          <Search className="w-5 h-5 text-[#FF1E56] mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies, TV series, anime..."
            className="w-full bg-transparent text-white placeholder-slate-400 text-base focus:outline-none"
          />
          {loading && <Loader2 className="w-4 h-4 text-[#FF1E56] animate-spin shrink-0 mr-2" />}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-white/5 p-2">
          {query.trim() && results.length === 0 && !loading && (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-slate-500 mt-1">Try searching by title, actor, or franchise</p>
            </div>
          )}

          {!query.trim() && (
            <div className="py-8 px-4 text-center text-slate-400 text-xs">
              <p className="text-slate-300 font-medium mb-1">Quick Search Tips</p>
              <p className="text-slate-500">Type movie or TV show names. Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-xs">Esc</kbd> anytime to exit.</p>
            </div>
          )}

          {results.map((item) => {
            const isMovie = item.media_type === 'movie' || 'title' in item;
            const title = ('title' in item ? item.title : item.name) || 'Untitled';
            const date = ('release_date' in item ? item.release_date : item.first_air_date);
            const watchUrl = isMovie ? `/watch/movie/${item.id}` : `/watch/tv/${item.id}`;

            return (
              <Link
                key={`${item.media_type}-${item.id}`}
                href={watchUrl}
                onClick={onClose}
                className="flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-[#1a1a24] transition-all group"
              >
                {/* Poster Thumbnail */}
                <div className="relative w-12 h-16 rounded-md overflow-hidden bg-[#111116] shrink-0 border border-white/5">
                  <Image
                    src={getTMDBImageUrl(item.poster_path, 'w300')}
                    alt={title}
                    fill
                    sizes="48px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white group-hover:text-[#FF85A1] transition-colors truncate">
                      {title}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-[#FF85A1] border border-[#FF1E56]/30">
                      {isMovie ? <Film className="w-2.5 h-2.5" /> : <Tv className="w-2.5 h-2.5" />}
                      {isMovie ? 'Movie' : 'TV'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                    <span>{formatYear(date)}</span>
                    <span className="flex items-center gap-1 text-amber-400">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {formatRating(item.vote_average)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Modal Footer */}
        {results.length > 0 && (
          <div className="p-3 border-t border-white/10 bg-[#0b0b0e] flex justify-between items-center text-xs text-slate-400">
            <span>Showing top {results.length} matches</span>
            <Link
              href={`/search?q=${encodeURIComponent(query)}`}
              onClick={onClose}
              className="text-[#FF1E56] hover:underline font-medium"
            >
              View all results &rarr;
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
