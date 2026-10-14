export interface VideoServer {
  id: string;
  name: string;
  badge: string;
  getMovieUrl: (tmdbId: number | string) => string;
  getTVUrl: (tmdbId: number | string, season: number, episode: number) => string;
}

export const VIDEO_SERVERS: VideoServer[] = [
  {
    id: 'server-1',
    name: 'Server 1 (Primary)',
    badge: 'MultiEmbed - Fast HD',
    getMovieUrl: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    getTVUrl: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
  },
  {
    id: 'server-2',
    name: 'Server 2',
    badge: 'VidLink - Ultra Clean',
    getMovieUrl: (id) => `https://vidlink.pro/movie/${id}`,
    getTVUrl: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}`,
  },
  {
    id: 'server-3',
    name: 'Server 3',
    badge: 'AutoEmbed - 1080p',
    getMovieUrl: (id) => `https://autoembed.co/movie/tmdb/${id}`,
    getTVUrl: (id, s, e) => `https://autoembed.co/tv/tmdb/${id}-${s}-${e}`,
  },
  {
    id: 'server-4',
    name: 'Server 4',
    badge: 'VidSrc - High Bitrate',
    getMovieUrl: (id) => `https://vidsrc.sh/embed/movie?tmdb=${id}`,
    getTVUrl: (id, s, e) => `https://vidsrc.sh/embed/tv?tmdb=${id}&season=${s}&episode=${e}`,
  },
  {
    id: 'server-5',
    name: 'Server 5',
    badge: '2Embed - Global Mirror',
    getMovieUrl: (id) => `https://www.2embed.cc/embed/${id}`,
    getTVUrl: (id, s, e) => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
  },
];

export function getEmbedUrl(
  serverId: string,
  type: 'movie' | 'tv',
  tmdbId: number | string,
  season: number = 1,
  episode: number = 1,
  timeSeconds?: number
): string {
  const server = VIDEO_SERVERS.find((s) => s.id === serverId) || VIDEO_SERVERS[0];
  const baseUrl = type === 'movie' ? server.getMovieUrl(tmdbId) : server.getTVUrl(tmdbId, season, episode);
  if (timeSeconds && timeSeconds > 0) {
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}t=${Math.floor(timeSeconds)}`;
  }
  return baseUrl;
}
