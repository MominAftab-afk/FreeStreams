# FreeStreams

A high-performance, cinematic media streaming and watch party aggregation platform built with **Next.js 16 (App Router)**, **TypeScript**, and **Tailwind CSS**.

---

## Key Features

- **Obsidian & Neon Rose Design System**: Bespoke dark aesthetic (`#070709`) with electric pink accents (`#FF1E56`), glassmorphism, zero Cumulative Layout Shift (CLS), and custom scrollbars.
- **Watch Together (Temporary Sync Rooms)**:
  - Generate temporary watch party links without requiring any login or signup.
  - Creator presence tracking: Sessions automatically expire when the room creator leaves.
  - In-app exit protection popup and browser unload warning for the host.
  - Live synchronized chat with timestamps and Host Crown badge.
- **Multi-Server Video Engine**:
  - 5 redundant streaming providers with active fallback:
    - Server 1: MultiEmbed (Fast HD - Primary)
    - Server 2: VidLink (Ultra Clean)
    - Server 3: AutoEmbed (1080p Mirror)
    - Server 4: VidSrc (High Bitrate)
    - Server 5: 2Embed (Global Backup)
  - Theater mode toggle and click-anywhere playback.
- **TV Series & Seasons Navigation**:
  - Interactive season dropdown and episode still thumbnails.
  - Seamless episode switching without full page reloads.
- **Local Continue Watching Tracker**:
  - Automatically saves watch history and playback timestamps to browser storage.
- **Instant Search & Command Palette**:
  - Live debounced search modal (`Cmd+K` or `Ctrl+K`).
- **Programmatic SEO & Rich Snippets**:
  - Structured JSON-LD schema (`schema.org/Movie` and `schema.org/TVSeries`) for Google search rich snippets.
  - Dynamic XML sitemap generator (`/sitemap.xml`) and crawler rules (`/robots.txt`).
- **Production Ready & Dockerized**:
  - Multi-stage `Dockerfile` and `docker-compose.yml` with healthcheck endpoint (`/api/health`).

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack, React 19)
- **Styling**: Tailwind CSS v4 + Vanilla CSS Design Tokens
- **Icons**: Lucide React
- **Data Source**: TMDB API v3 (Server-side fetched with ISR caching)

---

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/MominAftab-afk/FreeStreams.git
cd FreeStreams
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your free TMDB API Key or Read Access Token from [The Movie Database (TMDB)](https://www.themoviedb.org/settings/api).

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## Docker Deployment

To build and run in standalone production mode:
```bash
docker compose up -d --build
```
The service will start on port `3000` with automated container restart policies.

---

## Legal & DMCA Disclaimer
FreeStreams is an indexing media search tool. It does not host, upload, or store any media files on its servers. All contents are provided by third-party, non-affiliated services.
