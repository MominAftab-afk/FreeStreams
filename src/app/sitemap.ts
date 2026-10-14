import { MetadataRoute } from 'next';
import {
  getTrendingMovies,
  getTrendingTV,
  getPopularMovies,
  getPopularTV,
  getTopRatedMovies,
  getTopRatedTV,
} from '@/lib/tmdb';
import { getSiteUrl } from '@/lib/seo';

export const revalidate = 86400; // Cache sitemap for 24 hours

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();

  // Core Static Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/movies`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tv`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  try {
    // Fetch Top 100+ Trending, Popular, and Top Rated Movies & TV Series concurrently
    const results = await Promise.allSettled([
      getTrendingMovies('day'),
      getTrendingMovies('week'),
      getPopularMovies(1),
      getPopularMovies(2),
      getTopRatedMovies(1),
      getTrendingTV('day'),
      getTrendingTV('week'),
      getPopularTV(1),
      getPopularTV(2),
      getTopRatedTV(1),
    ]);

    const movieMap = new Map<number, { isTrending: boolean }>();
    const tvMap = new Map<number, { isTrending: boolean }>();

    // Process movies
    const trendingDayMovies = results[0].status === 'fulfilled' ? results[0].value : [];
    const trendingWeekMovies = results[1].status === 'fulfilled' ? results[1].value : [];
    const popularMovies1 = results[2].status === 'fulfilled' ? results[2].value : [];
    const popularMovies2 = results[3].status === 'fulfilled' ? results[3].value : [];
    const topRatedMovies = results[4].status === 'fulfilled' ? results[4].value : [];

    [...trendingDayMovies, ...trendingWeekMovies].forEach((m) => {
      movieMap.set(m.id, { isTrending: true });
    });
    [...popularMovies1, ...popularMovies2, ...topRatedMovies].forEach((m) => {
      if (!movieMap.has(m.id)) {
        movieMap.set(m.id, { isTrending: false });
      }
    });

    // Process TV series
    const trendingDayTV = results[5].status === 'fulfilled' ? results[5].value : [];
    const trendingWeekTV = results[6].status === 'fulfilled' ? results[6].value : [];
    const popularTV1 = results[7].status === 'fulfilled' ? results[7].value : [];
    const popularTV2 = results[8].status === 'fulfilled' ? results[8].value : [];
    const topRatedTV = results[9].status === 'fulfilled' ? results[9].value : [];

    [...trendingDayTV, ...trendingWeekTV].forEach((t) => {
      tvMap.set(t.id, { isTrending: true });
    });
    [...popularTV1, ...popularTV2, ...topRatedTV].forEach((t) => {
      if (!tvMap.has(t.id)) {
        tvMap.set(t.id, { isTrending: false });
      }
    });

    const movieRoutes: MetadataRoute.Sitemap = Array.from(movieMap.entries()).map(([id, info]) => ({
      url: `${baseUrl}/watch/movie/${id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: info.isTrending ? 0.85 : 0.75,
    }));

    const tvRoutes: MetadataRoute.Sitemap = Array.from(tvMap.entries()).map(([id, info]) => ({
      url: `${baseUrl}/watch/tv/${id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: info.isTrending ? 0.85 : 0.75,
    }));

    return [...staticRoutes, ...movieRoutes, ...tvRoutes];
  } catch (error) {
    console.error('Error generating dynamic sitemap:', error);
    return staticRoutes;
  }
}
