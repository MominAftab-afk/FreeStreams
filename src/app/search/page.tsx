import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Search, Film, Tv } from 'lucide-react';
import MediaCard from '@/components/media/MediaCard';
import AdBanner from '@/components/ads/AdBanner';
import { searchMulti } from '@/lib/tmdb';

import { getSiteUrl } from '@/lib/seo';

interface SearchPageProps {
  searchParams: Promise<{ q?: string; type?: string }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const sParams = await searchParams;
  const siteUrl = getSiteUrl();
  const query = sParams.q?.trim() || '';

  const title = query
    ? `Search Results for "${query}" | RoseFlix`
    : 'Search Movies & TV Shows in 1080p HD | RoseFlix';

  const description = query
    ? `Stream movies and television series matching "${query}" in full 1080p HD online on RoseFlix.`
    : 'Search our expansive catalog of movies and television series to stream in full 1080p HD on RoseFlix.';

  const canonicalUrl = `${siteUrl}/search${query ? `?q=${encodeURIComponent(query)}` : ''}`;

  return {
    title: {
      absolute: title,
    },
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const sParams = await searchParams;
  const query = sParams.q || '';
  const filterType = sParams.type || 'all';

  let results: any[] = [];
  if (query.trim()) {
    try {
      const data = await searchMulti(query.trim(), 1);
      results = data.results.filter(
        (item) =>
          (item.media_type === 'movie' || item.media_type === 'tv') &&
          (item.poster_path || item.backdrop_path)
      );
    } catch (err) {
      console.error('Search query error:', err);
    }
  }

  const filteredResults =
    filterType === 'movie'
      ? results.filter((i) => i.media_type === 'movie')
      : filterType === 'tv'
      ? results.filter((i) => i.media_type === 'tv')
      : results;

  return (
    <div className="min-h-screen pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Search Header */}
      <div className="max-w-2xl mx-auto text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
          Search Rose<span className="text-[#FF1E56]">Flix</span>
        </h1>

        {/* Search Form */}
        <form action="/search" method="GET" className="relative flex items-center">
          <Search className="absolute left-4 w-5 h-5 text-[#FF1E56]" />
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search by title, franchise, character..."
            className="w-full pl-12 pr-28 py-3.5 rounded-2xl bg-[#111116] border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-[#FF1E56] shadow-xl text-base transition-colors"
          />
          <button
            type="submit"
            className="absolute right-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#FF1E56] to-[#D90429] hover:from-[#FF007F] hover:to-[#FF1E56] text-white font-semibold text-xs transition-all shadow-md"
          >
            Search
          </button>
        </form>
      </div>

      {/* Search Ad slot */}
      <AdBanner zone="search-top" />

      {query.trim() && (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
          <p className="text-sm text-slate-400">
            Found <strong className="text-white">{filteredResults.length}</strong> results for &ldquo;
            <span className="text-[#FF85A1]">{query}</span>&rdquo;
          </p>

          {/* Type filters */}
          <div className="flex items-center gap-2">
            <Link
              href={`/search?q=${encodeURIComponent(query)}&type=all`}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${
                filterType === 'all'
                  ? 'bg-[#FF1E56] text-white'
                  : 'bg-[#111116] text-slate-400 hover:text-white'
              }`}
            >
              All
            </Link>
            <Link
              href={`/search?q=${encodeURIComponent(query)}&type=movie`}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1 ${
                filterType === 'movie'
                  ? 'bg-[#FF1E56] text-white'
                  : 'bg-[#111116] text-slate-400 hover:text-white'
              }`}
            >
              <Film className="w-3 h-3" />
              Movies
            </Link>
            <Link
              href={`/search?q=${encodeURIComponent(query)}&type=tv`}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1 ${
                filterType === 'tv'
                  ? 'bg-[#FF1E56] text-white'
                  : 'bg-[#111116] text-slate-400 hover:text-white'
              }`}
            >
              <Tv className="w-3 h-3" />
              TV Shows
            </Link>
          </div>
        </div>
      )}

      {/* Results Grid */}
      {filteredResults.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-5">
          {filteredResults.map((item, idx) => (
            <MediaCard key={`${item.media_type}-${item.id}`} item={item} priority={idx < 6} />
          ))}
        </div>
      ) : query.trim() ? (
        <div className="py-20 text-center text-slate-400">
          <p className="text-lg text-white font-medium">No results found for &ldquo;{query}&rdquo;</p>
          <p className="text-xs text-slate-500 mt-2">
            Try checking spelling or search for another popular movie or TV show.
          </p>
        </div>
      ) : (
        <div className="py-16 text-center text-slate-500 text-sm">
          Enter a title above to begin searching thousands of movies and series.
        </div>
      )}
    </div>
  );
}
