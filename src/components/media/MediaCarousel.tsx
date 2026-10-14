'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MediaCard from '@/components/media/MediaCard';
import { MediaItem, Movie, TVShow } from '@/types/tmdb';

interface MediaCarouselProps {
  title: string;
  items: (MediaItem | Movie | TVShow)[];
  viewAllHref?: string;
  icon?: React.ReactNode;
}

export default function MediaCarousel({
  title,
  items,
  viewAllHref,
  icon,
}: MediaCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="relative my-8 sm:my-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-[#FF1E56] to-[#FF007F] shadow-[0_0_10px_rgba(255,30,86,0.6)]" />
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            {title}
            {icon}
          </h2>
        </div>

        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-xs sm:text-sm font-semibold text-[#FF85A1] hover:text-white transition-colors"
          >
            Explore All &rarr;
          </Link>
        )}
      </div>

      {/* Rail Wrapper - isolated group/carousel so it doesn't leak to child card groups */}
      <div className="relative px-4 sm:px-6 lg:px-8 group/carousel">
        {/* Left Arrow */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#070709]/90 border border-white/10 text-white flex items-center justify-center shadow-2xl opacity-0 group-hover/carousel:opacity-100 hover:bg-[#FF1E56] hover:border-[#FF1E56] hover:scale-110 transition-all duration-300 disabled:hidden"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Scrollable Container */}
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-2"
        >
          {items.map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              className="shrink-0 w-[140px] sm:w-[175px] md:w-[200px] snap-start"
            >
              <MediaCard item={item} priority={idx < 4} />
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#070709]/90 border border-white/10 text-white flex items-center justify-center shadow-2xl opacity-0 group-hover/carousel:opacity-100 hover:bg-[#FF1E56] hover:border-[#FF1E56] hover:scale-110 transition-all duration-300 disabled:hidden"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </section>
  );
}
