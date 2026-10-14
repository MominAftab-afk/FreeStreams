import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Star, Calendar, Tv, Users } from 'lucide-react';
import TVPlayerSection from '@/components/media/TVPlayerSection';
import MediaCarousel from '@/components/media/MediaCarousel';
import AdBanner from '@/components/ads/AdBanner';
import { getTVDetails } from '@/lib/tmdb';
import { getTMDBImageUrl, formatYear, formatRating } from '@/lib/utils';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ s?: string; e?: string }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const sParams = await searchParams;
  const s = sParams.s || '1';
  const e = sParams.e || '1';

  try {
    const show = await getTVDetails(id);
    const year = formatYear(show.first_air_date);
    const topCast = show.credits?.cast.slice(0, 3).map((c) => c.name).join(', ') || '';
    const cleanOverview = show.overview ? `${show.overview.slice(0, 110)}...` : '';
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'RoseFlix';

    const title = `Watch ${show.name} Season ${s} Episode ${e} (${year}) Online HD - ${siteName}`;
    const description = `Stream ${show.name} (${year}) in full 1080p HD online. ${cleanOverview} Starring ${topCast}. Fast servers, English subtitles.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: show.backdrop_path ? [getTMDBImageUrl(show.backdrop_path, 'original')] : [],
      },
    };
  } catch {
    return {
      title: 'Watch TV Series Online HD - RoseFlix',
    };
  }
}

export default async function TVWatchPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sParams = await searchParams;

  const currentSeason = parseInt(sParams.s || '1', 10);
  const currentEpisode = parseInt(sParams.e || '1', 10);

  let show;
  try {
    show = await getTVDetails(id);
  } catch {
    notFound();
  }

  const year = formatYear(show.first_air_date);
  const topCast = show.credits?.cast.slice(0, 8) || [];
  const recommendations = show.recommendations?.results || show.similar?.results || [];

  // JSON-LD Structured Data for TV Series
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: show.name,
    image: show.poster_path ? getTMDBImageUrl(show.poster_path, 'original') : undefined,
    startDate: show.first_air_date,
    description: show.overview,
    numberOfSeasons: show.number_of_seasons,
    numberOfEpisodes: show.number_of_episodes,
    actor: topCast.map((c) => ({ '@type': 'Person', name: c.name })),
    aggregateRating: show.vote_count
      ? {
          '@type': 'AggregateRating',
          ratingValue: show.vote_average,
          bestRating: '10',
          worstRating: '1',
          ratingCount: show.vote_count,
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
        {/* TV Video Player + Episode Selector */}
        <section className="mb-8">
          <TVPlayerSection
            tvId={show.id}
            showTitle={show.name}
            backdropPath={show.backdrop_path}
            seasons={show.seasons || []}
            initialSeason={currentSeason}
            initialEpisode={currentEpisode}
          />
        </section>

        {/* Ad Banner below Player */}
        <AdBanner zone="player-bottom" />

        {/* Show Metadata Panel */}
        <div className="bg-[#0e0e13] border border-white/5 rounded-2xl p-6 sm:p-8 mt-6">
          <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
            {/* Poster Thumbnail */}
            <div className="relative w-36 sm:w-48 aspect-[2/3] rounded-xl overflow-hidden bg-[#161620] shrink-0 border border-white/10 shadow-xl self-start">
              <Image
                src={getTMDBImageUrl(show.poster_path, 'w500')}
                alt={show.name}
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
                    TV Series
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-white">
                    HD 1080p
                  </span>
                  <div className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-400 border border-amber-400/20">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{formatRating(show.vote_average)}</span>
                    <span className="text-slate-400 font-normal">({show.vote_count} votes)</span>
                  </div>
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {show.name}
                </h1>
                {show.tagline && (
                  <p className="text-sm italic text-[#FF85A1] mt-1">{show.tagline}</p>
                )}
              </div>

              {/* Meta stats */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 border-y border-white/5 py-3">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  First Aired: {year}
                </span>
                <span className="flex items-center gap-1.5">
                  <Tv className="w-4 h-4 text-slate-500" />
                  {show.number_of_seasons || 1} Seasons • {show.number_of_episodes || 0} Episodes
                </span>
                {show.status && (
                  <span>
                    Status: <strong className="text-white font-medium">{show.status}</strong>
                  </span>
                )}
              </div>

              {/* Genres */}
              {show.genres && show.genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {show.genres.map((g) => (
                    <Link
                      key={g.id}
                      href={`/tv?genre=${g.id}`}
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
                  {show.overview || 'No synopsis available for this TV series.'}
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

        {/* Recommendations / Similar Shows */}
        {recommendations.length > 0 && (
          <div className="mt-12">
            <MediaCarousel
              title="Similar Series You Might Enjoy"
              items={recommendations.map((t) => ({ ...t, media_type: 'tv' }))}
            />
          </div>
        )}
      </div>
    </div>
  );
}
