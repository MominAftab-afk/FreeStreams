'use client';

import React, { useState } from 'react';
import VideoPlayer from '@/components/media/VideoPlayer';
import EpisodeSelector from '@/components/media/EpisodeSelector';
import { SeasonSummary } from '@/types/tmdb';

interface TVPlayerSectionProps {
  tvId: number;
  showTitle: string;
  backdropPath?: string | null;
  seasons: SeasonSummary[];
  initialSeason: number;
  initialEpisode: number;
}

export default function TVPlayerSection({
  tvId,
  showTitle,
  backdropPath,
  seasons,
  initialSeason,
  initialEpisode,
}: TVPlayerSectionProps) {
  const [currentSeason, setCurrentSeason] = useState(initialSeason);
  const [currentEpisode, setCurrentEpisode] = useState(initialEpisode);

  const handleSelectEpisode = (season: number, episode: number) => {
    setCurrentSeason(season);
    setCurrentEpisode(episode);
  };

  return (
    <div>
      {/* Video Player */}
      <VideoPlayer
        tmdbId={tvId}
        type="tv"
        title={`${showTitle} - S${currentSeason} E${currentEpisode}`}
        backdropPath={backdropPath}
        season={currentSeason}
        episode={currentEpisode}
      />

      {/* Episode and Season Selector */}
      <EpisodeSelector
        tvId={tvId}
        seasons={seasons}
        currentSeason={currentSeason}
        currentEpisode={currentEpisode}
        onSelect={handleSelectEpisode}
      />
    </div>
  );
}
