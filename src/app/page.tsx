import React from 'react';
import type { Metadata } from 'next';
import HeroBanner from '@/components/media/HeroBanner';
import MediaCarousel from '@/components/media/MediaCarousel';
import ContinueWatching from '@/components/media/ContinueWatching';
import AdBanner from '@/components/ads/AdBanner';
import JsonLd from '@/components/seo/JsonLd';
import {
  getTrendingAll,
  getTrendingMovies,
  getTrendingTV,
  getPopularMovies,
  getTopRatedMovies,
  getTopRatedTV,
} from '@/lib/tmdb';
import { getSiteUrl, buildWebSiteSearchSchema } from '@/lib/seo';
import { Flame, Star, Film, Tv, Trophy } from 'lucide-react';

export const revalidate = 3600; // 1 hour ISR revalidation

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: 'RoseFlix - Stream Movies & TV Series Online Free in Full HD',
  description:
    'Watch trending movies, popular blockbusters, and top-rated TV series online in HD. Free streaming across fast redundant servers with zero buffering.',
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: 'RoseFlix - Stream Movies & TV Series Online Free in Full HD',
    description:
      'Stream thousands of movies and TV shows online in crisp 1080p HD with English subtitles. Fast servers, zero login required.',
    url: siteUrl,
  },
};

export default async function HomePage() {
  // Fetch lists in parallel for ultra-fast server response
  const [
    trendingAll,
    trendingMovies,
    trendingTV,
    popularMovies,
    topRatedMovies,
    topRatedTV,
  ] = await Promise.all([
    getTrendingAll('week'),
    getTrendingMovies('day'),
    getTrendingTV('day'),
    getPopularMovies(1),
    getTopRatedMovies(1),
    getTopRatedTV(1),
  ]);

  const websiteSearchSchema = buildWebSiteSearchSchema(siteUrl);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Google Sitelinks Search Box Structured Data */}
      <JsonLd data={websiteSearchSchema} />

      {/* Dynamic Hero Carousel */}
      <HeroBanner items={trendingAll} />

      {/* User's Continue Watching rail (rendered client-side via localStorage) */}
      <ContinueWatching />

      {/* Content Carousels */}
      <div className="space-y-2 -mt-6 sm:-mt-10 relative z-20">
        <MediaCarousel
          title="Trending Movies"
          items={trendingMovies}
          viewAllHref="/movies"
          icon={<Flame className="w-5 h-5 text-[#FF1E56]" />}
        />

        <MediaCarousel
          title="Trending TV Series"
          items={trendingTV}
          viewAllHref="/tv"
          icon={<Tv className="w-5 h-5 text-[#FF1E56]" />}
        />

        {/* In-feed Native Ad Slot */}
        <AdBanner zone="in-feed" />

        <MediaCarousel
          title="Popular Blockbusters"
          items={popularMovies}
          viewAllHref="/movies"
          icon={<Film className="w-5 h-5 text-[#FF85A1]" />}
        />

        <MediaCarousel
          title="Top Rated TV Series"
          items={topRatedTV}
          viewAllHref="/tv"
          icon={<Star className="w-5 h-5 text-amber-400" />}
        />

        <MediaCarousel
          title="All-Time Critically Acclaimed Movies"
          items={topRatedMovies}
          viewAllHref="/movies"
          icon={<Trophy className="w-5 h-5 text-amber-400" />}
        />
      </div>
    </div>
  );
}
