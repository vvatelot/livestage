# LiveStage

Offline-first PWA to manage a song repertoire (ChordPro format), setlists, and a tablet-style stage prompter mode.

## Stack

- **Next.js 15** + React + TypeScript
- **Serwist** (PWA / service worker)
- **Dexie.js** (IndexedDB offline-first)
- **Supabase** (auth, cloud sync)
- **ChordSheetJS** (ChordPro rendering)
- **Tailwind CSS** + shadcn/ui

## Getting started

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Structure

```
livestage/
├── apps/web/          # Next.js PWA application
└── supabase/          # Migrations + Edge Functions
```

## Features

- Song library (lyrics + ChordPro chords)
- Setlists with drag & drop
- Full-screen stage mode (live prompter)
- Supabase cloud sync
- Ultimate Guitar import

## Interface

### Navigation

The app is divided into three main areas, accessible from the header:

| Section | Route | Description |
|---------|-------|-------------|
| **Home** | `/` | Overview and shortcuts |
| **Library** | `/songs` | List, search, import and export songs |
| **Setlists** | `/setlists` | Create and manage setlists |
| **Stage mode** | `/live/[id]` | Full-screen prompter (from a setlist) |
| **Account** | `/auth` | Supabase authentication |

On mobile, a fixed bottom navigation bar provides access to the library and setlists. The sync indicator (header) shows cloud sync status.

### Library (`/songs`)

- **Search** by title or artist
- **New song** → ChordPro editor
- **Import**: Ultimate Guitar bookmarklet (recommended, reads `UGAPP` / embedded JSON), UG URL, UG page HTML, or ChordPro text / UG JSON
- **`.cho` file**: direct import (`.cho`, `.pro`, `.chordpro`, `.txt`)
- **Export**: download in ChordPro format (`.cho`)
- Click a song → edit

### Song editor (`/songs/new`, `/songs/[id]`)

The editor is a **ChordPro text editor with live HTML preview** — it is not a WYSIWYG editor (you cannot click in the preview to edit chords or lyrics).

| Area | Role |
|------|------|
| **Title / Artist / Key / Capo** | Metadata (separate fields, auto-filled from ChordPro text when empty) |
| **ChordPro textarea** | Main content (lyrics + chords) |
| **± buttons** | **Preview-only** transposition (does not change saved content) |
| **Hide / Preview** | Show or hide the render panel |
| **Preview** | HTML render of chords above lyrics (ChordSheetJS) |
| **Print** | Dedicated print page then system print dialog (includes preview transposition) |

When editing, changes are saved automatically to IndexedDB. The **Save** button returns to the library.

**Printing**: from the editor, song header, or stage mode. For a PDF, choose “Save as PDF” in the browser’s print dialog.

#### ChordPro syntax

LiveStage stores and displays the [ChordPro](https://www.chordpro.org/) format, parsed by ChordSheetJS.

**Directives** (metadata and structure):

```chordpro
{title: My title}
{artist: My artist}
{key: G}
{capo: 3}
{comment: Intro — 4 bars}
```

**Inline chords** — in square brackets, placed just before the syllable:

```chordpro
Let it [Am]be, let it [C/G]be
```

**Sections**:

```chordpro
{start_of_verse}
First line [G]with chords
{end_of_verse}

{start_of_chorus}
Chorus [D]here
{end_of_chorus}
```

**Full example**:

```chordpro
{title: Swing Low Sweet Chariot}
{artist: Traditional}
{key: D}

{start_of_verse}
Swing [D]low, sweet [G]chari[D]ot
Comin' for to carry me [A7]home
{end_of_verse}

{start_of_chorus}
[D]Country roads, take me [A]home
To the [E]place I be[A]long
{end_of_chorus}
```

Supported directives: metadata (`title`, `artist`, `key`, `capo`, `subtitle`…), sections (`start_of_verse`, `start_of_chorus`, `start_of_tab`…), comments (`comment`), chord diagrams (`define`, `chord`). See the [ChordPro spec](https://www.chordpro.org/chordpro/chordpro-file-format-specification/) and [ChordSheetJS directives](https://github.com/martijnversluis/ChordSheetJS#supported-chordpro-directives).

### Setlists (`/setlists`)

- **New setlist**: name + optional date
- **Detail** (`/setlists/[id]`): add songs, reorder via drag & drop, remove
- **Duplicate / Delete** from the list
- **Print**: A4 sheet (title, date, songs and sections)
- **Stage mode**: launches the prompter for the setlist

Songs in a setlist are preloaded for offline use.

### Stage mode (`/live/[id]`)

Full-screen prompter optimized for tablets:

- **Navigation**: keyboard arrows, left/right swipe, bottom buttons
- **Controls** (top bar, hidden after 3 s): font size, dark/light mode, lock
- **Auto-scroll**: automatic scrolling; speed is saved per song
- **Transposition**: per song, in session (does not modify the source)
- **Wake lock**: prevents the screen from sleeping
- **Escape** or ✕ button: return to the setlist

### PWA installation

Install LiveStage on a tablet for offline use on stage:

- **iOS**: Share → Add to Home Screen
- **Android**: Install app

## Deployment

### Option 1 — Docker Compose (recommended)

The simplest approach for a VPS or local server.

**Prerequisites**: Docker + Docker Compose, Supabase project configured (see SQL migration).

```bash
# 1. Configure environment variables
cp .env.docker.example .env.docker
# Edit .env.docker with your Supabase keys

# 2. Build and run
pnpm docker:build
pnpm docker:up

# App is available at http://localhost:3000 (or the PORT you set)
```

Useful commands:

```bash
pnpm docker:logs    # view logs
pnpm docker:down    # stop
```

> **Important**: `NEXT_PUBLIC_*` variables are baked into the build. If you change the Supabase URL or key, run `pnpm docker:build` again.

Without Supabase, the app still works in local mode (IndexedDB), but without cloud sync.

### Option 2 — Vercel / Netlify

1. Connect the Git repository
2. **Root directory**: `apps/web`
3. **Build command**: `cd ../.. && pnpm install && pnpm build`
4. **Output**: handled automatically by Next.js
5. Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Best if you want zero-ops deployment without managing a server.

### Option 3 — Manual VPS (no Docker)

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local
# Add Supabase keys
pnpm build
pnpm start
```

Use a reverse proxy (Caddy, Nginx, Traefik) with HTTPS in front of port 3000.

### Supabase

The Supabase backend stays **in the cloud** (supabase.com) in all cases. Run migrations in the Supabase **SQL Editor** (in order) before the first login:

1. [`supabase/migrations/20250520000000_initial_schema.sql`](supabase/migrations/20250520000000_initial_schema.sql)
2. [`supabase/migrations/20250520140000_fix_rls_user_id.sql`](supabase/migrations/20250520140000_fix_rls_user_id.sql) — fixes RLS errors (`new row violates row-level security policy`)
3. [`supabase/migrations/20250520150000_add_youtube_url.sql`](supabase/migrations/20250520150000_add_youtube_url.sql) — YouTube video URL field per song

Cloud sync only works **after logging in** at `/auth`. RLS errors in logs usually mean: missing migration, expired session, or sync attempted while not logged in.

```bash
supabase login
supabase link --project-ref <your-ref>
supabase db push
supabase functions deploy import-ultimate-guitar
```

If `uuid_generate_v4() does not exist`: migrations use `gen_random_uuid()` (Supabase cloud compatible). Run `supabase db push` again after updating the repo.
