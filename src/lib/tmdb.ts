import {
  Movie,
  TVShow,
  MediaItem,
  SeasonDetails,
  Credits,
  Genre,
  TMDBResponse,
} from '@/types/tmdb';

const TMDB_BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const TMDB_READ_ACCESS_TOKEN = process.env.TMDB_READ_ACCESS_TOKEN;
const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;

interface FetchOptions {
  revalidate?: number;
  params?: Record<string, string | number | undefined>;
}

async function tmdbFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`);

  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (TMDB_READ_ACCESS_TOKEN) {
    headers['Authorization'] = `Bearer ${TMDB_READ_ACCESS_TOKEN}`;
  } else if (TMDB_API_KEY) {
    url.searchParams.set('api_key', TMDB_API_KEY);
  }

  const revalidate = options.revalidate ?? 3600; // default 1 hour

  try {
    const res = await fetch(url.toString(), {
      headers,
      next: { revalidate },
    });

    if (!res.ok) {
      console.error(`TMDB API Error [${res.status}] ${res.statusText} at ${url.pathname}`);
      throw new Error(`TMDB Request failed with status ${res.status}: ${res.statusText}`);
    }

    return (await res.json()) as T;
  } catch (error) {
    console.error(`Network or parse error on ${endpoint}:`, error);
    throw error;
  }
}

// ==================== HOME / TRENDING ====================

export async function getTrendingAll(timeWindow: 'day' | 'week' = 'week'): Promise<MediaItem[]> {
  const data = await tmdbFetch<TMDBResponse<MediaItem>>(`/trending/all/${timeWindow}`, {
    revalidate: 3600,
  });
  return data.results.filter((item) => item.media_type === 'movie' || item.media_type === 'tv');
}

export async function getTrendingMovies(timeWindow: 'day' | 'week' = 'day'): Promise<Movie[]> {
  const data = await tmdbFetch<TMDBResponse<Movie>>(`/trending/movie/${timeWindow}`, {
    revalidate: 3600,
  });
  return data.results.map((m) => ({ ...m, media_type: 'movie' }));
}

export async function getTrendingTV(timeWindow: 'day' | 'week' = 'day'): Promise<TVShow[]> {
  const data = await tmdbFetch<TMDBResponse<TVShow>>(`/trending/tv/${timeWindow}`, {
    revalidate: 3600,
  });
  return data.results.map((t) => ({ ...t, media_type: 'tv' }));
}

export async function getPopularMovies(page: number = 1): Promise<Movie[]> {
  const data = await tmdbFetch<TMDBResponse<Movie>>('/movie/popular', {
    params: { page },
    revalidate: 3600,
  });
  return data.results.map((m) => ({ ...m, media_type: 'movie' }));
}

export async function getPopularTV(page: number = 1): Promise<TVShow[]> {
  const data = await tmdbFetch<TMDBResponse<TVShow>>('/tv/popular', {
    params: { page },
    revalidate: 3600,
  });
  return data.results.map((t) => ({ ...t, media_type: 'tv' }));
}

export async function getTopRatedMovies(page: number = 1): Promise<Movie[]> {
  const data = await tmdbFetch<TMDBResponse<Movie>>('/movie/top_rated', {
    params: { page },
    revalidate: 86400,
  });
  return data.results.map((m) => ({ ...m, media_type: 'movie' }));
}

export async function getTopRatedTV(page: number = 1): Promise<TVShow[]> {
  const data = await tmdbFetch<TMDBResponse<TVShow>>('/tv/top_rated', {
    params: { page },
    revalidate: 86400,
  });
  return data.results.map((t) => ({ ...t, media_type: 'tv' }));
}

// ==================== MOVIE DETAILS ====================

export interface DetailedMovie extends Movie {
  credits?: Credits;
  recommendations?: TMDBResponse<Movie>;
  similar?: TMDBResponse<Movie>;
}

export async function getMovieDetails(id: number | string): Promise<DetailedMovie> {
  const data = await tmdbFetch<DetailedMovie>(`/movie/${id}`, {
    params: { append_to_response: 'credits,recommendations,similar' },
    revalidate: 86400,
  });
  return { ...data, media_type: 'movie' };
}

// ==================== TV DETAILS ====================

export interface DetailedTVShow extends TVShow {
  credits?: Credits;
  recommendations?: TMDBResponse<TVShow>;
  similar?: TMDBResponse<TVShow>;
}

export async function getTVDetails(id: number | string): Promise<DetailedTVShow> {
  const data = await tmdbFetch<DetailedTVShow>(`/tv/${id}`, {
    params: { append_to_response: 'credits,recommendations,similar' },
    revalidate: 86400,
  });
  return { ...data, media_type: 'tv' };
}

export async function getTVSeason(tvId: number | string, seasonNumber: number): Promise<SeasonDetails> {
  return await tmdbFetch<SeasonDetails>(`/tv/${tvId}/season/${seasonNumber}`, {
    revalidate: 86400,
  });
}

// ==================== SEARCH & DISCOVERY ====================

export async function searchMulti(query: string, page: number = 1): Promise<TMDBResponse<MediaItem>> {
  return await tmdbFetch<TMDBResponse<MediaItem>>('/search/multi', {
    params: { query, page, include_adult: 'false' },
    revalidate: 1800, // 30 mins
  });
}

export async function discoverMovies(params: {
  genreId?: number | string;
  sortBy?: string;
  page?: number;
}): Promise<TMDBResponse<Movie>> {
  return await tmdbFetch<TMDBResponse<Movie>>('/discover/movie', {
    params: {
      with_genres: params.genreId,
      sort_by: params.sortBy || 'popularity.desc',
      page: params.page || 1,
      include_adult: 'false',
    },
    revalidate: 3600,
  });
}

export async function discoverTV(params: {
  genreId?: number | string;
  sortBy?: string;
  page?: number;
}): Promise<TMDBResponse<TVShow>> {
  return await tmdbFetch<TMDBResponse<TVShow>>('/discover/tv', {
    params: {
      with_genres: params.genreId,
      sort_by: params.sortBy || 'popularity.desc',
      page: params.page || 1,
      include_adult: 'false',
    },
    revalidate: 3600,
  });
}

// ==================== GENRES ====================

export async function getMovieGenres(): Promise<Genre[]> {
  const data = await tmdbFetch<{ genres: Genre[] }>('/genre/movie/list', {
    revalidate: 86400,
  });
  return data.genres;
}

export async function getTVGenres(): Promise<Genre[]> {
  const data = await tmdbFetch<{ genres: Genre[] }>('/genre/tv/list', {
    revalidate: 86400,
  });
  return data.genres;
}
