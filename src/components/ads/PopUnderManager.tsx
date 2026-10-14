'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';

export default function PopUnderManager() {
  const pathname = usePathname();
  const adsEnabled = process.env.NEXT_PUBLIC_ENABLE_ADS === 'true';
  const rawUrl = process.env.NEXT_PUBLIC_POPUNDER_SCRIPT_URL?.trim();

  // Guard 1: Must be explicitly enabled
  // Guard 2: Must be non-empty and start with http://, https://, or //
  // Guard 3: Never inject or trigger on Watch Party rooms (/party/*)
  if (
    !adsEnabled ||
    !rawUrl ||
    (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://') && !rawUrl.startsWith('//')) ||
    pathname?.startsWith('/party')
  ) {
    return null;
  }

  return (
    <Script
      id="mateflix-popunder"
      src={rawUrl}
      strategy="afterInteractive"
    />
  );
}
