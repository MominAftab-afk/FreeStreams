# Project Implementation & Architecture Blueprint (`implementation.md`)

## 1. Executive Summary & Product Vision
This document serves as the master technical and design specification for a high-performance, ultra-clean media streaming aggregation platform built on **Next.js (App Router)**. 

**Core Objectives:**
1. **Aesthetic Excellence:** A bespoke "Obsidian & Neon Rose" (Black & Pink) UI designed to rival tier-1 streaming platforms (Netflix, Apple TV+) with zero layout shifts, instant transitions, and glassmorphic depth.
2. **Programmatic SEO Dominance:** Automated server-side metadata, structured JSON-LD schema, and dynamic sitemaps to capture millions of long-tail search queries on Google.
3. **High-Yield Monetization:** Strategic, non-layout-breaking integration of high-CPM ad networks (Pop-unders, Interstitials, Native Banners) engineered to maximize revenue per session without destroying user retention.
4. **Resilient Infrastructure:** Dockerized standalone architecture ready for instant deployment on low-cost, high-autonomy VPS instances.

---

## 2. Design System: "Obsidian & Neon Rose" (Senior UI/UX Spec)
To make the site look fiercely professional and avoid the "cheap template" look of standard streaming sites, strict adherence to color contrast, typography, and micro-interactions is mandatory.

### 2.1 Color Palette (Tailwind Configuration)
* **Primary Background (Deep Obsidian):** `#070709` (Never use pure `#000000` for cards; reserve pure black for the video player theater mode).
* **Surface / Card Background:** `#111116` with `1px solid rgba(255, 255, 255, 0.06)` subtle borders.
* **Glassmorphic Overlays (Navbar/Modals):** `bg-[#0b0b0e]/80 backdrop-blur-xl border-b border-white/10`.
* **Primary Brand Accent (Electric Pink):** `#FF1E56` (Used for primary CTAs, active states, play buttons, and progress bars).
* **Secondary Accent (Cyber Magenta):** `#FF007F` to `#D90429` gradient (`bg-gradient-to-r from-[#FF1E56] to-[#FF007F]`).
* **Soft Pink Glow (Shadows/Ambience):** `0 0 25px -5px rgba(255, 30, 86, 0.45)`.
* **Typography Colors:**
  * Primary Text: `#F8F9FA` (Crisp off-white for zero eye strain).
  * Secondary/Muted Text: `#94A3B8` (Metadata, release years, durations).
  * Badge/Rating Accent: `#FF85A1` (Soft pastel pink for HD/4K tags).

### 2.2 Typography & Hierarchy
* **Heading Font:** `Plus Jakarta Sans` or `Outfit` (Bold/ExtraBold, tight tracking `tracking-tight` for cinematic impact).
* **Body/UI Font:** `Inter` or `Geist Sans` (Clean, highly legible at small sizes for episode lists and synopses).

### 2.3 Anti-Glitch & Polish Rules (Zero CLS)
* **Strict Aspect Ratios:** All movie posters must enforce `aspect-[2/3]` and backdrops `aspect-video` with shimmering dark-pink skeleton loaders (`animate-pulse bg-[#1a1a24]`) before images load. This guarantees a **Cumulative Layout Shift (CLS) of 0**.
* **Image Optimization:** Use `next/image` with `unoptimized` toggleable via env (to avoid Vercel/server CPU spikes on VPS) or custom Cloudflare loader, fetching `w500` for grids and `original` for Hero banners.
* **Smooth Carousels:** Native CSS scroll-snap with hidden scrollbars and custom floating pink neon navigation chevrons that appear only on container hover.

---

## 3. Technical Architecture & Stack

### 3.1 Tech Stack
* **Framework:** Next.js 14/15 (App Router, Server Components by default for speed & SEO).
* **Language:** TypeScript (Strict mode for zero runtime crashes).
* **Styling:** Tailwind CSS + `lucide-react` (Icons) + `framer-motion` (Subtle page & modal transitions).
* **State Management:** `nuqs` (URL query state for instant shareable filters/seasons) + `localStorage` hook for "Continue Watching" & "Watchlist" (Zero database overhead required for MVP).
* **Data Source:** TMDB API v3 (Server-side fetched with Next.js `fetch` caching & ISR revalidation).

### 3.2 Directory Structure
```text
src/
├── app/
│   ├── (main)/
│   │   ├── page.tsx                  # Homepage (Hero + Trending Carousels)
│   │   ├── movies/page.tsx           # Movies Catalog & Genre Filter
│   │   ├── tv/page.tsx               # TV Shows Catalog & Genre Filter
│   │   └── search/page.tsx           # Instant Debounced Search Page
│   ├── watch/
│   │   ├── movie/[id]/page.tsx       # Movie Theater & Multi-Server Player
│   │   └── tv/[id]/page.tsx          # TV Player (Season/Episode Selector via URL params)
│   ├── api/
│   │   └── health/route.ts           # Docker/VPS healthcheck endpoint
│   ├── layout.tsx                    # Root Layout, Fonts, SEO defaults, Ad Scripts
│   ├── sitemap.ts                    # Dynamic Programmatic Sitemap Generator
│   └── robots.ts                     # Search Engine Crawler Rules
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx                # Glassmorphic sticky header + instant search modal
│   │   └── Footer.tsx                # DMCA disclaimer, SEO links, clean branding
│   ├── media/
│   │   ├── HeroBanner.tsx            # Auto-rotating top trending showcase
│   │   ├── MediaCarousel.tsx         # Horizontal GPU-accelerated poster rail
│   │   ├── MediaCard.tsx             # Hover-expand card with rating, year, quick-play
│   │   └── VideoPlayer.tsx           # Multi-source iframe switcher + Ad overlay controller
│   └── ads/
│       ├── AdBanner.tsx              # Non-intrusive native banner slot
│       └── PopUnderManager.tsx       # Smart frequency-capped click monetizer
├── lib/
│   ├── tmdb.ts                       # Typed TMDB API wrapper with ISR caching
│   ├── resolvers.ts                  # Multi-server embed URL generator & fallback list
│   └── utils.ts                      # Tailwind merge & formatting helpers
└── types/
    └── tmdb.ts                       # Full TypeScript interfaces for Movies/TV/Cast
```

---

## 4. Multi-Server Video Resolver Architecture (Reliability Engine)
Single embed sources go down or buffer. To make the site feel superior to competitors, the player component will include a **"Switch Server"** bar right above the video player with 4 to 5 redundant providers.

### 4.1 Resolver Matrix (`src/lib/resolvers.ts`)
When a user visits `/watch/movie/27205` or `/watch/tv/1399?s=1&e=1`, the player dynamically constructs URLs across these top providers:

1. **Server 1 (Primary - Fast HD):** `https://vidsrc.xyz/embed/movie/{tmdb_id}` | `.../tv/{tmdb_id}/{s}-{e}`
2. **Server 2 (Multi-Lang / Subs):** `https://vidsrc.pro/embed/movie/{tmdb_id}` | `.../tv/{tmdb_id}/{s}/{e}`
3. **Server 3 (High Bitrate Mirror):** `https://vidsrc.cc/v2/embed/movie/{tmdb_id}` | `.../tv/{tmdb_id}/{s}/{e}`
4. **Server 4 (Auto-Fallback):** `https://multiembed.mov/?video_id={tmdb_id}&tmdb=1`
5. **Server 5 (Backup Stream):** `https://embed.su/embed/movie/{tmdb_id}` | `.../tv/{tmdb_id}/{s}/{e}`

### 4.2 Player UX Features
* **Theater Mode Toggle:** Expands the player to `90vw` and dims the rest of the UI to `#000000`.
* **Auto-Save Progress:** Saves `{ id, type, title, poster, season, episode, timestamp }` to `localStorage` on load so the user sees a **"Continue Watching"** row on the homepage immediately upon returning.

---

## 5. SEO Master Strategy (Ranking #1 on Google)
Media sites win or die by organic search traffic. Because Next.js renders on the server (SSR/ISR), Google bots will read full HTML pages packed with keywords instead of an empty React shell.

### 5.1 Programmatic Title & Meta Templates
Every `/watch/movie/[id]` and `/watch/tv/[id]` page must dynamically generate `generateMetadata()` targeting high-volume search intent:
* **Movie Title Pattern:** `Watch {Movie Title} ({Release Year}) Online Free in HD - {SiteName}`
* **TV Title Pattern:** `Watch {Show Name} Season {S} Episode {E} ({Year}) Online HD - {SiteName}`
* **Meta Description:** `Stream {Title} ({Year}) in full 1080p HD online. {First 110 chars of TMDB synopsis}... Starring {Top 3 Cast Members}. Fast servers, English subtitles.`

### 5.2 Structured Data (JSON-LD Rich Snippets)
Inject `<script type="application/ld+json">` inside every Watch page using the official `schema.org/Movie` and `schema.org/TVSeries` specs:
* Includes `name`, `image`, `datePublished`, `description`, `actor`, `director`, and `aggregateRating` (mapped from TMDB `vote_average` & `vote_count`).
* **Why this matters:** It forces Google to display **star ratings, release year, and cast details directly in search results**, skyrocketing your Click-Through Rate (CTR) above plain links.

### 5.3 Dynamic XML Sitemaps (`app/sitemap.ts`)
* Automatically generates segmented sitemaps (`/sitemap/0.xml`, `/sitemap/1.xml`) indexing trending, popular, top-rated, and upcoming movies/shows directly from TMDB so Google indexes thousands of pages immediately upon launch.

### 5.4 Semantic HTML & Internal Linking
* Every watch page includes a **"Similar Movies / Recommended"** grid (6–12 items) and clickable **Genre / Cast tags**. This creates a massive internal spiderweb of links that keeps Google crawlers indexing your site deeply and decreases user bounce rate.

---

## 6. Monetization Architecture (Maximizing Revenue Without Killing UX)
To earn maximum revenue while keeping the "Obsidian & Neon Rose" UI looking elite, ads must be **controlled by your code**, not randomly injected over the layout.

### 6.1 The "Fake Play" First-Click Shield (Highest Earner)
Embed resolvers carry their own ads inside the iframe. To make sure **you** get paid first on every user session:
1. Render a custom, ultra-sleek **Black & Pink Poster Overlay** with a glowing pink Play Button directly on top of the video container before the iframe loads.
2. **Click #1 (User clicks your custom Play Button):** Triggers your high-CPM pop-under/direct-link script (Adsterra / PopAds), sets a cookie/sessionStorage timestamp (`last_pop_time`), and immediately mounts the actual video `iframe`.
3. **Frequency Cap:** Only trigger 1 pop-under per user every **45 minutes**. This keeps users happy so they bookmark your site and return daily (returning traffic = compounding passive income).

### 6.2 Native Banner Placements (Zero Layout Shift)
Reserve fixed-height, dark-styled containers (`border border-[#FF1E56]/20 bg-[#111116] rounded-xl`) in 3 high-visibility zones:
1. **Below the Video Player (`728x90` Desktop / `320x50` Mobile):** Highest eye-tracking zone while users switch servers or episodes.
2. **In-Feed Carousel Divider:** A native banner block positioned cleanly between the "Trending Movies" and "Popular TV Shows" rows.
3. **Search Results Sidebar/Header:** Clean native ad slot on the search catalog page.

### 6.3 Environment-Controlled Ad Toggle
Manage all ad scripts via `.env` variables so you can develop locally with zero annoying pop-ups and activate them in production instantly:
```env
NEXT_PUBLIC_TMDB_API_KEY=your_key_here
NEXT_PUBLIC_TMDB_BASE_URL=https://api.themoviedb.org/3
NEXT_PUBLIC_SITE_NAME=MateFlix
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Monetization Controls (Set to 'true' when deploying to VPS)
NEXT_PUBLIC_ENABLE_ADS=false
NEXT_PUBLIC_POPUNDER_SCRIPT_URL=https://your-adnetwork-script.js
NEXT_PUBLIC_DIRECT_LINK_URL=https://your-high-cpm-direct-link.com
```

---

## 7. Performance, Caching & Anti-Rate-Limit Strategy
TMDB has API rate limits, and hitting their servers on every page view will slow down your site.
* **Next.js Data Cache (ISR):**
  * **Homepage / Trending Lists:** Cache for 1 hour (`next: { revalidate: 3600 }`).
  * **Movie / TV Details & Cast:** Cache for 24 hours (`next: { revalidate: 86400 }`).
  * **Search Queries:** Client-side debounced (300ms delay) routed through a cached Next.js Route Handler (`/api/search?q=...`) to keep your API key hidden from browser network tabs! *(Security Upgrade: Rename `NEXT_PUBLIC_TMDB_API_KEY` to `TMDB_API_KEY` for server fetches so competitors cannot steal your key from inspect element).*

---

## 8. Step-by-Step Build & Execution Roadmap (For Antigravity / Local Dev)

Follow this exact sequence to build the codebase cleanly without errors:

### Phase 1: Foundation & Theme Setup
1. Initialize Next.js App Router with TypeScript and Tailwind CSS.
2. Configure `tailwind.config.ts` with the **Obsidian (`#070709`)** and **Neon Rose (`#FF1E56`)** color tokens, custom glow box-shadows, and font families.
3. Create `src/lib/tmdb.ts` server utility with automatic ISR caching and error boundary handling.

### Phase 2: Core UI Components
1. Build the **Glassmorphic Navbar** with a live command-palette style search modal (`Cmd+K` or click to search).
2. Build the **HeroBanner** component featuring full-bleed backdrop imagery, a bottom-to-top `#070709` gradient vignette, pink HD badges, and "Watch Now" CTA.
3. Build the **MediaCard** and **MediaCarousel** components with smooth hover scale (`hover:scale-105 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,30,86,0.4)]`).

### Phase 3: Watch Pages & Multi-Server Engine
1. Build `/watch/movie/[id]/page.tsx` and `/watch/tv/[id]/page.tsx`.
2. Implement the **Server Switcher Bar** (Server 1–5) with active neon-pink tab indicators.
3. For TV Shows, build a sleek **Season Dropdown & Episode Grid** that updates the player seamlessly without full-page reloads.
4. Integrate the `localStorage` **Continue Watching** tracker.

### Phase 4: SEO & Monetization Injection
1. Add dynamic `generateMetadata()` and `JSON-LD` schema generators to all Watch routes.
2. Create `app/sitemap.ts` and `app/robots.ts`.
3. Add the frequency-capped `PopUnderManager` overlay and native `AdBanner` slots controlled by `NEXT_PUBLIC_ENABLE_ADS`.

### Phase 5: Dockerization & VPS Deployment
1. Configure `next.config.mjs` with `output: 'standalone'`.
2. Build the multi-stage `Dockerfile` and `docker-compose.yml` with automatic container restart (`restart: unless-stopped`) and Nginx reverse proxy configuration.
