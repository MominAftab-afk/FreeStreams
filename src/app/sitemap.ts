import { MetadataRoute } from 'next';
import { getTrendingMovies, getTrendingTV } from '@/lib/tmdb';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

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
    const [movies, tvShows] = await Promise.all([
      getTrendingMovies('week'),
      getTrendingTV('week'),
    ]);

    const movieRoutes: MetadataRoute.Sitemap = movies.map((movie) => ({
      url: `${baseUrl}/watch/movie/${movie.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    const tvRoutes: MetadataRoute.Sitemap = tvShows.map((show) => ({
      url: `${baseUrl}/watch/tv/${show.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    return [...staticRoutes, ...movieRoutes, ...tvRoutes];
  } catch (error) {
    console.error('Error generating dynamic sitemap:', error);
    return staticRoutes;
  }
}
