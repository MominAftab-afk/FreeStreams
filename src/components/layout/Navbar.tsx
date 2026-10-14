'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Film, Tv, Flame, Menu, X, PlayCircle } from 'lucide-react';
import SearchModal from '@/components/media/SearchModal';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Global keyboard shortcut for search (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Movies', href: '/movies', icon: Film },
    { label: 'TV Shows', href: '/tv', icon: Tv },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#0b0b0e]/90 backdrop-blur-xl border-b border-white/10 py-3 shadow-2xl'
            : 'bg-gradient-to-b from-[#070709]/90 to-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF1E56] to-[#FF007F] flex items-center justify-center shadow-[0_0_20px_rgba(255,30,86,0.5)] group-hover:shadow-[0_0_28px_rgba(255,30,86,0.8)] transition-all">
              <PlayCircle className="w-5 h-5 text-white fill-white/20" />
            </div>
            <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-white">
              Mate<span className="text-[#FF1E56] drop-shadow-[0_0_12px_rgba(255,30,86,0.8)]">Flix</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-[#111116]/80 p-1.5 rounded-full border border-white/5 backdrop-blur-md">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#FF1E56] text-white shadow-[0_0_15px_rgba(255,30,86,0.5)]'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-3">
            {/* Search Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-[#111116] border border-white/10 hover:border-[#FF1E56]/50 text-slate-300 hover:text-white transition-all group"
              title="Search (Cmd+K)"
            >
              <Search className="w-4 h-4 text-slate-400 group-hover:text-[#FF1E56] transition-colors" />
              <span className="text-xs text-slate-400 hidden sm:inline">Search...</span>
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white/5 rounded border border-white/10">
                ⌘K
              </kbd>
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white bg-[#111116] border border-white/10"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#0e0e13] border-b border-white/10 px-4 pt-3 pb-5 space-y-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                    isActive
                      ? 'bg-[#FF1E56] text-white'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Instant Search Palette Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
