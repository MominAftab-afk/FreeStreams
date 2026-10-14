import React from 'react';
import type { Metadata } from 'next';
import WatchPartyView from '@/components/party/WatchPartyView';

interface PartyPageProps {
  params: Promise<{ roomId: string }>;
}

export async function generateMetadata({ params }: PartyPageProps): Promise<Metadata> {
  const { roomId } = await params;
  return {
    title: `Watch Together (Room ${roomId}) - RoseFlix`,
    description: 'Join a temporary synchronized watch party session on RoseFlix. No login required.',
    robots: {
      index: false, // Temporary watch parties should not be indexed by Google crawlers
      follow: false,
    },
  };
}

export default async function PartyRoomPage({ params }: PartyPageProps) {
  const { roomId } = await params;

  return <WatchPartyView roomId={roomId} />;
}
