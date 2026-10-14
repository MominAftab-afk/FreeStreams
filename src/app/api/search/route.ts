import { NextRequest, NextResponse } from 'next/server';
import { searchMulti } from '@/lib/tmdb';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const page = parseInt(searchParams.get('page') || '1', 10);

  if (!query || !query.trim()) {
    return NextResponse.json({ results: [], total_pages: 0, total_results: 0 });
  }

  try {
    const data = await searchMulti(query.trim(), page);
    // Filter to only movie and tv shows with titles and posters
    const filteredResults = data.results.filter(
      (item) => (item.media_type === 'movie' || item.media_type === 'tv') && (item.poster_path || item.backdrop_path)
    );

    return NextResponse.json({
      ...data,
      results: filteredResults,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Failed to search media catalog' },
      { status: 500 }
    );
  }
}
