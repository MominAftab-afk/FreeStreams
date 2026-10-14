'use client';

import { useEffect } from 'react';

export default function PopUnderManager() {
  useEffect(() => {
    const adsEnabled = process.env.NEXT_PUBLIC_ENABLE_ADS === 'true';
    const scriptUrl = process.env.NEXT_PUBLIC_POPUNDER_SCRIPT_URL;

    if (!adsEnabled || !scriptUrl) return;

    // Check frequency cap (e.g. 45 mins)
    const lastPop = localStorage.getItem('roseflix_last_pop');
    const now = Date.now();
    const capDuration = 45 * 60 * 1000;

    if (!lastPop || now - parseInt(lastPop, 10) > capDuration) {
      const script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;
      document.body.appendChild(script);

      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, []);

  return null;
}
