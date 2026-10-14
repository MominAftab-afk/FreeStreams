'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Play, Film, Tv } from 'lucide-react';
import { Movie, TVShow, MediaItem } from '@/types/tmdb';
import { getTMDBImageUrl, formatYear, formatRating } from '@/lib/utils';

interface MediaCardProps {
  item: MediaItem | Movie | TVShow;
  priority?: boolean;
}

export default function MediaCard({ item, priority = false }: MediaCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const isMovie = item.media_type === 'movie' || 'title' in item;
  const title = ('title' in item ? item.title : item.name) || 'Untitled';
  const releaseDate = 'release_date' in item ? item.release_date : item.first_air_date;
  const year = formatYear(releaseDate);
  const watchUrl = isMovie ? `/watch/movie/${item.id}` : `/watch/tv/${item.id}`;
  const accessibleLabel = `Watch ${title} (${year}) Online Full HD on RoseFlix`;

  return (
    <Link
      href={watchUrl}
      title={accessibleLabel}
      aria-label={accessibleLabel}
      className="group/card relative flex flex-col rounded-xl overflow-hidden bg-[#111116] border border-white/5 transition-all duration-300 hover:border-[#FF1E56]/40 hover:shadow-[0_8px_25px_-5px_rgba(255,30,86,0.3)] hover:-translate-y-1 focus:outline-none"
    >
      {/* Poster Image Container (Strict aspect-[2/3] for 0 CLS) */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#16161f]">
        {/* Shimmer Placeholder before load */}
        {!imageLoaded && <div className="absolute inset-0 skeleton-shimmer" />}

        <Image
          src={getTMDBImageUrl(item.poster_path, 'w500')}
          alt={`${title} (${year}) official poster`}
          fill
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          onLoad={() => setImageLoaded(true)}
          className={`object-cover transition-transform duration-500 ease-out group-hover/card:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#070709]/80 backdrop-blur-md text-[#FF85A1] border border-white/10">
            {isMovie ? <Film className="w-2.5 h-2.5" /> : <Tv className="w-2.5 h-2.5" />}
            {isMovie ? 'Movie' : 'TV'}
          </span>
          <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-[#FF1E56] text-white shadow-sm">
            HD
          </span>
        </div>

        {/* Hover Vignette & Quick Play Button */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-black/30 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-11 h-11 rounded-full bg-[#FF1E56] text-white flex items-center justify-center shadow-[0_0_20px_rgba(255,30,86,0.8)] transform scale-90 group-hover/card:scale-100 transition-all duration-300">
            <Play className="w-4 h-4 fill-white ml-0.5" />
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-3 flex flex-col justify-between flex-1 bg-[#0e0e13]">
        <h3 className="font-semibold text-sm text-white line-clamp-1 group-hover/card:text-[#FF85A1] transition-colors">
          {title}
        </h3>

        <div className="flex items-center justify-between mt-1.5 text-xs text-slate-400">
          <span>{year}</span>
          <div className="flex items-center gap-1 text-amber-400 font-medium">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{formatRating(item.vote_average)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
