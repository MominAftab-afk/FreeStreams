import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Film, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import MediaCard from '@/components/media/MediaCard';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import { discoverMovies, getMovieGenres } from '@/lib/tmdb';
import { getSiteUrl, buildBreadcrumbSchema } from '@/lib/seo';

interface MoviesPageProps {
  searchParams: Promise<{ genre?: string; page?: string; sort?: string }>;
}

export async function generateMetadata({ searchParams }: MoviesPageProps): Promise<Metadata> {
  const sParams = await searchParams;
  const siteUrl = getSiteUrl();
  const selectedGenre = sParams.genre;
  const page = sParams.page ? parseInt(sParams.page, 10) : 1;

  let genreName = '';
  if (selectedGenre) {
    try {
      const genres = await getMovieGenres();
      genreName = genres.find((g) => g.id.toString() === selectedGenre)?.name || '';
    } catch {}
  }

  const title = genreName
    ? `Watch ${genreName} Movies Online Free in Full HD${page > 1 ? ` (Page ${page})` : ''} | RoseFlix`
    : `Watch Movies Online Free in Full HD${page > 1 ? ` (Page ${page})` : ''} | RoseFlix`;

  const description = genreName
    ? `Stream top ${genreName} movies in full 1080p HD online on RoseFlix. Fast multi-server streaming with English subtitles and zero buffering.`
    : 'Browse thousands of high-definition movies across Action, Comedy, Sci-Fi, Drama, Horror, and more. Free instant streaming on RoseFlix.';

  const canonicalUrl = `${siteUrl}/movies${selectedGenre ? `?genre=${selectedGenre}` : ''}`;

  return {
    title: {
      absolute: title,
    },
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'website',
      url: canonicalUrl,
      title,
      description,
      siteName: 'RoseFlix',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function MoviesPage({ searchParams }: MoviesPageProps) {
  const sParams = await searchParams;
  const selectedGenre = sParams.genre;
  const currentPage = parseInt(sParams.page || '1', 10);
  const sortBy = sParams.sort || 'popularity.desc';
  const siteUrl = getSiteUrl();

  const [genres, moviesData] = await Promise.all([
    getMovieGenres(),
    discoverMovies({
      genreId: selectedGenre,
      sortBy,
      page: currentPage,
    }),
  ]);

  const movies = moviesData.results.map((m) => ({ ...m, media_type: 'movie' as const }));
  const totalPages = Math.min(moviesData.total_pages, 500);

  const activeGenreName = genres.find((g) => g.id.toString() === selectedGenre)?.name;

  // Breadcrumbs items
  const breadcrumbItems = [
    { name: 'Movies', url: `${siteUrl}/movies` },
    ...(activeGenreName
      ? [{ name: `${activeGenreName} Movies`, url: `${siteUrl}/movies?genre=${selectedGenre}` }]
      : []),
  ];
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbItems);

  return (
    <div className="min-h-screen pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Schema.org Breadcrumb */}
      <JsonLd data={breadcrumbSchema} />

      {/* Semantic Visible Breadcrumbs */}
      <Breadcrumbs items={breadcrumbItems} />

      {/* Page Title & Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF85A1] mb-1.5">
            <Film className="w-4 h-4 text-[#FF1E56]" />
            Cinema Catalog
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {activeGenreName ? `${activeGenreName} Movies` : 'All Movies in Full HD'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Discover the highest-rated blockbusters and trending films available to stream right now.
          </p>
        </div>

        {/* Page counter */}
        <div className="text-xs text-slate-400 bg-[#111116] px-3.5 py-1.5 rounded-full border border-white/5">
          Page <strong className="text-white">{currentPage}</strong> of {totalPages}
        </div>
      </div>

      {/* Genre Filter Pills */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
          <Filter className="w-3.5 h-3.5 text-[#FF1E56]" />
          Filter by Genre
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/movies"
            className={`text-xs px-3.5 py-1.5 rounded-full transition-all font-medium ${
              !selectedGenre
                ? 'bg-[#FF1E56] text-white shadow-[0_0_12px_rgba(255,30,86,0.6)]'
                : 'bg-[#111116] text-slate-300 hover:text-white hover:bg-[#1a1a24] border border-white/5'
            }`}
          >
            All Genres
          </Link>

          {genres.map((g) => {
            const isSelected = selectedGenre === g.id.toString();
            return (
              <Link
                key={g.id}
                href={`/movies?genre=${g.id}`}
                className={`text-xs px-3.5 py-1.5 rounded-full transition-all font-medium ${
                  isSelected
                    ? 'bg-[#FF1E56] text-white shadow-[0_0_12px_rgba(255,30,86,0.6)]'
                    : 'bg-[#111116] text-slate-300 hover:text-white hover:bg-[#1a1a24] border border-white/5'
                }`}
              >
                {g.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Movies Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-5">
        {movies.map((movie, idx) => (
          <MediaCard key={movie.id} item={movie} priority={idx < 6} />
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="mt-12 flex items-center justify-center gap-4">
        {currentPage > 1 && (
          <Link
            href={`/movies?${selectedGenre ? `genre=${selectedGenre}&` : ''}page=${currentPage - 1}`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#111116] border border-white/10 hover:border-[#FF1E56]/50 text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous Page
          </Link>
        )}

        <span className="text-xs text-slate-400 px-3 py-2 rounded-xl bg-[#0b0b0e] border border-white/5">
          {currentPage} / {totalPages}
        </span>

        {currentPage < totalPages && (
          <Link
            href={`/movies?${selectedGenre ? `genre=${selectedGenre}&` : ''}page=${currentPage + 1}`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#111116] border border-white/10 hover:border-[#FF1E56]/50 text-white transition-colors"
          >
            Next Page
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
