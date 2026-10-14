import React from 'react';

interface AdBannerProps {
  zone?: 'player-bottom' | 'in-feed' | 'search-top';
  className?: string;
}

export default function AdBanner({ zone = 'player-bottom', className = '' }: AdBannerProps) {
  const adsEnabled = process.env.NEXT_PUBLIC_ENABLE_ADS === 'true';

  if (!adsEnabled) {
    return null;
  }

  // Dimension styling based on zone
  const dimensions =
    zone === 'player-bottom'
      ? 'w-full max-w-[728px] h-[90px]'
      : zone === 'in-feed'
      ? 'w-full max-w-[970px] h-[100px]'
      : 'w-full max-w-[728px] h-[90px]';

  return (
    <div className={`my-6 flex flex-col items-center justify-center ${className}`}>
      <div
        className={`${dimensions} rounded-xl bg-[#111116] border border-[#FF1E56]/20 flex flex-col items-center justify-center p-2 text-center text-xs text-slate-500 overflow-hidden relative shadow-[0_0_15px_rgba(255,30,86,0.05)]`}
      >
        <span className="text-[10px] uppercase tracking-widest text-[#FF85A1]/70 font-semibold mb-1">
          Sponsored Advertisement
        </span>
        <div className="w-full h-full flex items-center justify-center text-slate-600 border border-dashed border-white/5 rounded-lg">
          {/* Ad Network Script injects here in production */}
          <span className="text-xs">Banner Placement ({zone})</span>
        </div>
      </div>
    </div>
  );
}
