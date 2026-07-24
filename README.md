# PawPlay

A simple, kid-friendly virtual pet app. No accounts, no login, no ads, no
analytics, no third-party tracking — just a pet to feed, dress up, and take
care of.

## What's saved

The app remembers, between visits:

- Which animal the pet is (dog, lion, elephant, duck, cow, frog, or monkey)
- The uploaded pet photo
- The Health/Vitality Meter (Pet Hospital)
- The Love Meter (Pet & Play)
- Wardrobe choices (Dress Up Party)

## Running it locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

By default the app saves everything to `localStorage` in your browser, so
it works immediately with no setup and persists across visits on the same
device/browser.

## Connecting a real database (Supabase)

To make the pet's data persist in an actual database (e.g. so it survives
clearing browser data, or so you could later sync across devices), connect
a free Supabase project:

1. Create a project at [supabase.com](https://supabase.com).
2. In the Supabase dashboard, go to **SQL Editor** and run the contents of
   [`supabase/schema.sql`](./supabase/schema.sql). This creates a single
   `pet_state` table with one row per anonymous device.
3. Go to **Project Settings → API** and copy the **Project URL** and the
   **anon public** key.
4. Copy `.env.example` to `.env.local` and fill in both values:

   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

5. Restart `npm run dev`. The yellow "Saving on this device only" banner on
   the Home screen will disappear once Supabase is connected, and all
   state will read/write from Supabase instead of `localStorage`.

No further code changes are needed — the app detects the environment
variables automatically (see `src/lib/supabaseClient.js`).

### How "no accounts" persistence works

Since there's no login, each browser generates a random, anonymous device
ID (a UUID) on first visit and stores it in `localStorage`. That ID is the
key used to read/write the pet's row in Supabase. There's no password or
server-side check tied to it — privacy relies on the ID being random and
never shared, not on authentication. This is intentional to keep the app
simple for kids, but it means anyone who somehow obtained another device's
ID could read/write that pet's data. Don't store anything sensitive here.

## Photo upload

Tapping the pet avatar (or "Add pet photo") opens the device's native photo
picker. Photos are read directly in the browser and stored as the pet's
saved state (in `localStorage` and/or Supabase) — no separate file storage
service or upload endpoint is required. Images are limited to 5MB and must
be an image file.

## Building for production

```bash
npm run build
npm run preview
```

`npm run build` outputs a static site in `dist/`, deployable to any static
host (Vercel, Netlify, Cloudflare Pages, GitHub Pages, etc.). Remember to
set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment
variables in your host's dashboard if you want the deployed app to use
Supabase.

### Single-file build

`npm run build:single-file` produces one self-contained `dist-artifact/index.html`
with all JS, CSS, and images inlined (no separate asset files). Useful for
hosting a quick preview anywhere a single static file will do. Note that a
strict-CSP host (like a Claude Artifact) will block any outbound network
request, so a build hosted that way can only run in local-storage-only mode —
it can't reach a real Supabase project.
