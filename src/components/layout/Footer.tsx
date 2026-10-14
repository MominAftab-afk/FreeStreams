import React from 'react';
import Link from 'next/link';
import { PlayCircle, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/5 bg-[#050507] text-slate-400 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF1E56] to-[#FF007F] flex items-center justify-center shadow-[0_0_15px_rgba(255,30,86,0.5)]">
                <PlayCircle className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                Mate<span className="text-[#FF1E56]">Flix</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              Stream the latest movies and TV series in stunning full HD. Experience zero buffer streaming, rich curated collections, and instant multi-server playback.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-[#FF85A1] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/movies" className="hover:text-[#FF85A1] transition-colors">
                  Movies Catalog
                </Link>
              </li>
              <li>
                <Link href="/tv" className="hover:text-[#FF85A1] transition-colors">
                  TV Series
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal / Trust */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Legal & DMCA</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5 text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-[#FF1E56]" />
                <span>DMCA Compliant</span>
              </li>
              <li className="text-[11px] text-slate-500 leading-normal">
                This site does not store files on any server. All contents are provided by non-affiliated third parties.
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Line */}
        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© {currentYear} MateFlix. All rights reserved.</p>
          <div className="flex items-center gap-1 text-slate-400 text-xs">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-[#FF1E56] fill-[#FF1E56]" />
            <span>for cinema lovers</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
