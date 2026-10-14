import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Star, Clock, Calendar, Film, Users, Play, Heart } from 'lucide-react';
import VideoPlayer from '@/components/media/VideoPlayer';
import MediaCarousel from '@/components/media/MediaCarousel';
import AdBanner from '@/components/ads/AdBanner';
import { getMovieDetails } from '@/lib/tmdb';
import { getTMDBImageUrl, formatYear, formatRating, formatRuntime } from '@/lib/utils';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const movie = await getMovieDetails(id);
    const year = formatYear(movie.release_date);
    const topCast = movie.credits?.cast.slice(0, 3).map((c) => c.name).join(', ') || '';
    const cleanOverview = movie.overview ? `${movie.overview.slice(0, 120)}...` : '';
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'RoseFlix';

    const title = `Watch ${movie.title} (${year}) Online Free in HD - ${siteName}`;
    const description = `Stream ${movie.title} (${year}) in full 1080p HD online. ${cleanOverview} Starring ${topCast}. Fast servers, English subtitles.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: movie.backdrop_path ? [getTMDBImageUrl(movie.backdrop_path, 'original')] : [],
      },
    };
  } catch {
    return {
      title: 'Watch Movie Online HD - RoseFlix',
    };
  }
}

export default async function MovieWatchPage({ params }: PageProps) {
  const { id } = await params;
  let movie;
  try {
    movie = await getMovieDetails(id);
  } catch {
    notFound();
  }

  const year = formatYear(movie.release_date);
  const runtime = formatRuntime(movie.runtime);
  const topCast = movie.credits?.cast.slice(0, 8) || [];
  const director = movie.credits?.crew.find((c) => c.job === 'Director')?.name;
  const recommendations = movie.recommendations?.results || movie.similar?.results || [];

  // JSON-LD Structured Data for Google Rich Snippets
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: movie.title,
    image: movie.poster_path ? getTMDBImageUrl(movie.poster_path, 'original') : undefined,
    datePublished: movie.release_date,
    description: movie.overview,
    director: director ? { '@type': 'Person', name: director } : undefined,
    actor: topCast.map((c) => ({ '@type': 'Person', name: c.name })),
    aggregateRating: movie.vote_count
      ? {
          '@type': 'AggregateRating',
          ratingValue: movie.vote_average,
          bestRating: '10',
          worstRating: '1',
          ratingCount: movie.vote_count,
        }
      : undefined,
  };

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-16">
      {/* Inject JSON-LD Rich Snippet */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Video Player & Server Switcher Section */}
        <section className="mb-8">
          <VideoPlayer
            tmdbId={movie.id}
            type="movie"
            title={movie.title}
            backdropPath={movie.backdrop_path}
          />
        </section>

        {/* Ad Placement below Video Player */}
        <AdBanner zone="player-bottom" />

        {/* Movie Metadata & Information Panel */}
        <div className="bg-[#0e0e13] border border-white/5 rounded-2xl p-6 sm:p-8 mt-6">
          <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
            {/* Poster Thumbnail */}
            <div className="relative w-36 sm:w-48 aspect-[2/3] rounded-xl overflow-hidden bg-[#161620] shrink-0 border border-white/10 shadow-xl self-start">
              <Image
                src={getTMDBImageUrl(movie.poster_path, 'w500')}
                alt={movie.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 640px) 144px, 192px"
              />
            </div>

            {/* Details Content */}
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#FF1E56] text-white">
                    Movie
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-white">
                    HD 1080p
                  </span>
                  <div className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-400 border border-amber-400/20">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{formatRating(movie.vote_average)}</span>
                    <span className="text-slate-400 font-normal">({movie.vote_count} votes)</span>
                  </div>
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {movie.title}
                </h1>
                {movie.tagline && (
                  <p className="text-sm italic text-[#FF85A1] mt-1">{movie.tagline}</p>
                )}
              </div>

              {/* Meta stats */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 border-y border-white/5 py-3">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  {year}
                </span>
                {runtime && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-500" />
                    {runtime}
                  </span>
                )}
                {director && (
                  <span>
                    Director: <strong className="text-white font-medium">{director}</strong>
                  </span>
                )}
              </div>

              {/* Genres */}
              {movie.genres && movie.genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map((g) => (
                    <Link
                      key={g.id}
                      href={`/movies?genre=${g.id}`}
                      className="text-xs px-3 py-1 rounded-full bg-[#161620] hover:bg-[#FF1E56]/20 text-slate-300 hover:text-white border border-white/10 hover:border-[#FF1E56]/40 transition-colors"
                    >
                      {g.name}
                    </Link>
                  ))}
                </div>
              )}

              {/* Synopsis */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Synopsis</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {movie.overview || 'No synopsis available for this title.'}
                </p>
              </div>

              {/* Top Cast */}
              {topCast.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#FF1E56]" />
                    Featured Cast
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {topCast.map((cast) => (
                      <div
                        key={cast.id}
                        className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-[#161620] border border-white/5"
                      >
                        <div className="relative w-6 h-6 rounded-full overflow-hidden bg-slate-800 shrink-0">
                          {cast.profile_path ? (
                            <Image
                              src={getTMDBImageUrl(cast.profile_path, 'w300')}
                              alt={cast.name}
                              fill
                              sizes="24px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-700 flex items-center justify-center text-[10px] text-white">
                              {cast.name[0]}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-slate-200 font-medium">{cast.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recommendations / Similar Carousel */}
        {recommendations.length > 0 && (
          <div className="mt-12">
            <MediaCarousel
              title="You May Also Like"
              items={recommendations.map((m) => ({ ...m, media_type: 'movie' }))}
            />
          </div>
        )}
      </div>
    </div>
  );
}
