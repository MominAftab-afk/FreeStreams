'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Info, Star, Calendar, Flame, ChevronRight, ChevronLeft } from 'lucide-react';
import { MediaItem } from '@/types/tmdb';
import { getTMDBImageUrl, formatYear, formatRating } from '@/lib/utils';

interface HeroBannerProps {
  items: MediaItem[];
}

export default function HeroBanner({ items }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const featuredItems = items.slice(0, 6);

  useEffect(() => {
    if (featuredItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredItems.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [featuredItems.length]);

  if (!featuredItems || featuredItems.length === 0) return null;

  const current = featuredItems[currentIndex];
  const isMovie = current.media_type === 'movie' || 'title' in current;
  const title = ('title' in current ? current.title : current.name) || 'Featured Title';
  const releaseDate = 'release_date' in current ? current.release_date : current.first_air_date;
  const watchUrl = isMovie ? `/watch/movie/${current.id}` : `/watch/tv/${current.id}`;

  return (
    <div className="relative w-full h-[70vh] sm:h-[80vh] min-h-[500px] max-h-[820px] overflow-hidden bg-[#070709]">
      {/* Background Backdrops */}
      {featuredItems.map((item, idx) => (
        <div
          key={item.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          {item.backdrop_path && (
            <Image
              src={getTMDBImageUrl(item.backdrop_path, 'original')}
              alt={title}
              fill
              priority={idx === 0}
              className="object-cover object-top filter brightness-[0.85]"
              sizes="100vw"
            />
          )}

          {/* Vignette Gradients */}
          {/* Bottom Gradient into Obsidian background */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-[#070709]/60 to-transparent" />
          {/* Left Gradient for desktop readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#070709] via-[#070709]/80 to-transparent w-full lg:w-3/4" />
          {/* Top subtle fade for navbar */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#070709]/70 via-transparent to-transparent h-32" />
        </div>
      ))}

      {/* Hero Content Overlay */}
      <div className="relative z-20 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-16 sm:pb-20">
        <div className="max-w-2xl space-y-4">
          {/* Top Pill Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FF1E56] text-white shadow-[0_0_15px_rgba(255,30,86,0.6)]">
              <Flame className="w-3.5 h-3.5 fill-white" />
              #1 Trending
            </span>

            <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-white/10 text-white backdrop-blur-md border border-white/10">
              4K ULTRA HD
            </span>

            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#111116]/80 text-amber-400 border border-amber-400/20 backdrop-blur-md">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>{formatRating(current.vote_average)}</span>
            </div>

            <span className="flex items-center gap-1 text-xs text-slate-300 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {formatYear(releaseDate)}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight line-clamp-2 drop-shadow-lg">
            {title}
          </h1>

          {/* Synopsis */}
          <p className="text-sm sm:text-base text-slate-300 line-clamp-3 leading-relaxed max-w-xl text-shadow">
            {current.overview || 'Stream this title in high-definition audio and crystal clear visuals across all redundant servers.'}
          </p>

          {/* Call-to-Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href={watchUrl}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base text-white bg-gradient-to-r from-[#FF1E56] to-[#D90429] hover:from-[#FF007F] hover:to-[#FF1E56] shadow-[0_0_25px_rgba(255,30,86,0.5)] hover:shadow-[0_0_35px_rgba(255,30,86,0.8)] hover:scale-105 active:scale-95 transition-all duration-300"
            >
              <Play className="w-5 h-5 fill-white" />
              Watch Now
            </Link>

            <Link
              href={watchUrl}
              className="flex items-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-sm sm:text-base text-white bg-[#111116]/80 hover:bg-[#1a1a24] border border-white/10 hover:border-white/20 backdrop-blur-md transition-all duration-200"
            >
              <Info className="w-5 h-5 text-slate-300" />
              Overview & Cast
            </Link>
          </div>
        </div>

        {/* Carousel Slide Indicators */}
        <div className="absolute right-4 sm:right-8 bottom-6 sm:bottom-12 flex items-center gap-2 z-20">
          {featuredItems.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? 'w-8 bg-[#FF1E56] shadow-[0_0_10px_rgba(255,30,86,0.8)]'
                  : 'w-2 bg-white/20 hover:bg-white/40'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
