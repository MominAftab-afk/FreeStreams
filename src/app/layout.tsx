import type { Metadata } from 'next';
import { Outfit, Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PopUnderManager from '@/components/ads/PopUnderManager';
import { getSiteUrl } from '@/lib/seo';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  title: {
    default: 'RoseFlix - Stream Movies & TV Series in 1080p HD',
    template: '%s | RoseFlix',
  },
  description:
    'Stream thousands of movies and TV series online in crisp full HD. High-speed playback, redundant servers, English subtitles, and zero buffer streaming.',
  keywords: [
    'movies online',
    'stream free hd',
    'watch series online',
    'roseflix',
    'stream movies',
    'free streaming',
    'watch movies online free',
    'watch tv online full hd',
  ],
  authors: [{ name: 'RoseFlix' }],
  creator: 'RoseFlix',
  publisher: 'RoseFlix',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'RoseFlix',
    title: 'RoseFlix - Stream Movies & TV Series in 1080p HD',
    description:
      'Stream thousands of movies and TV series online in crisp full HD. High quality, multi-server redundancy, and zero buffering.',
    images: [
      {
        url: '/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'RoseFlix - Stream Movies & TV Series Online Free in HD',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RoseFlix - Stream Movies & TV Series in 1080p HD',
    description: 'Stream movies and TV series in 1080p HD online with fast multi-server playback.',
    images: ['/og-default.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${outfit.variable} ${inter.variable} dark antialiased`}
    >
      <body className="min-h-screen bg-[#070709] text-[#F8F9FA] flex flex-col font-sans selection:bg-[#FF1E56] selection:text-white">
        <PopUnderManager />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
