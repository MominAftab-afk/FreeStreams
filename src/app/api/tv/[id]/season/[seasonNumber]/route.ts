import { NextRequest, NextResponse } from 'next/server';
import { getTVSeason } from '@/lib/tmdb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; seasonNumber: string }> }
) {
  const { id, seasonNumber } = await params;

  try {
    const seasonData = await getTVSeason(id, parseInt(seasonNumber, 10));
    return NextResponse.json(seasonData);
  } catch (error) {
    console.error(`Error fetching season ${seasonNumber} for show ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch season details' },
      { status: 500 }
    );
  }
}
