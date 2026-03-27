# Frames — Cinematic Video Section Design
**Date:** 2026-03-28
**Status:** Approved
**Branch:** feat/frames-video-section

---

## Overview

Add a "Frames" section to showcase short cinematic video clips (5–10 seconds). Mirrors the MyShots architecture with a landing page preview section, a dedicated `/frames` page, and a full admin panel section. Completely separate from `my_shots` — new Supabase table, new components, new route.

---

## User Experience

### Video Card Behaviour (Option C — approved)
- **At rest:** Shows poster thumbnail (Cloudinary auto-generated or admin override). Duration badge top-left. Play button overlay centered.
- **On hover:** Muted video preview plays inline. Play button fades out. Progress bar animates at bottom. "PLAYING" label appears top-right.
- **On click:** Lightbox modal opens with full audio, native video controls styled to match the site.

### Loading Strategy (no lag)
- All `<video>` elements use `preload="none"` and `data-src` — src is only set when the card enters the viewport via `IntersectionObserver`.
- Hover only triggers play after the video's `canplay` event fires — no stutter.
- Thumbnails load as regular `<img>` with native lazy loading (`loading="lazy"`).
- Videos on the landing page section (limit=4) only autoload src when within 200px of viewport.

---

## Supabase — `my_videos` Table

```sql
create table my_videos (
  id          uuid primary key default gen_random_uuid(),
  title       text,
  category    text,
  video_url   text,           -- Cloudinary video URL
  thumb_url   text,           -- optional override thumbnail (Supabase storage)
  aspect_ratio text default '16/9',  -- '9/16' | '16/9' | '1/1' | '4/3' | '4/5'
  sort_order  int default 0,
  is_active   boolean default true,
  created_at  timestamptz default now()
);
```

**RLS policies** (match existing tables):
- Public SELECT (anon): `is_active = true`
- Authenticated INSERT/UPDATE/DELETE

### Thumbnail Logic
Cloudinary auto-thumb: replace `/upload/` with `/upload/so_0/` in the video URL and swap extension to `.jpg`. If `thumb_url` is set on the row, use that instead.

```js
function getThumb(videoUrl, thumbOverride) {
  if (thumbOverride) return thumbOverride;
  return videoUrl
    .replace('/upload/', '/upload/so_0,w_800/')
    .replace(/\.(mp4|mov|webm)$/, '.jpg');
}
```

---

## Components

### `src/components/MyVideos.jsx`
Props: `limit?: number`, `title?: string`, `subtitle?: string`

- Fetches from `my_videos` where `is_active = true`, ordered by `sort_order`.
- If `limit` is set, slices result and shows "View All Frames →" link to `/frames`.
- Renders a masonry CSS grid (3 columns, `auto` rows, `gap: 12px`).
- Each card is a `VideoCard` sub-component (defined in same file).

**VideoCard:**
- Renders `<img>` thumbnail (lazy) + `<video preload="none" muted loop playsInline>`.
- `IntersectionObserver` sets `video.src = data-src` on first intersection.
- `onMouseEnter` → `video.play()` (only after `canplay`), hide play overlay.
- `onMouseLeave` → `video.pause(); video.currentTime = 0`, show play overlay.
- `onClick` → calls `onOpenLightbox(video)` callback.
- Duration badge (top-left), MagneticCard 3D tilt effect (same as MyShots).
- Card meta (title + category) fades in on hover from bottom gradient overlay.
- Aspect ratio set via inline `style={{ aspectRatio: card.aspect_ratio }}`.

**VideoLightbox** (sub-component, same file):
- Full-screen dark overlay (`rgba(0,0,0,0.92)`), Framer Motion `AnimatePresence`.
- Inner panel: `<video>` with `controls`, `autoPlay`, `src` set on open.
- Orange progress bar replaces native scrubber (custom via `timeupdate` event).
- Play/pause button in `#ff4d00`, mute toggle, close button top-right.
- `onClick` on backdrop closes; `Escape` key closes.
- Spring animation: `opacity 0→1`, inner panel `scale 0.92→1`, `stiffness:80, damping:18`.

### `src/pages/FramesPage.jsx`
Mirrors `MyShotsPage.jsx` structure:

- Fetches `site_settings` for `brand` + `frames` key (hero video URL, hero overlay opacity).
- **Hero section:** Full-viewport, `<video autoPlay muted loop playsInline>` as background. Dark overlay `rgba(0,0,0,0.5)`. Large `FRAMES.` headline (white, `#ff4d00` dot). Subtitle text below.
- Hero video: stored in `site_settings` key `frames.hero_video` (Cloudinary URL).
- Below hero: `<MyVideos />` without limit (shows all active videos), on `#f5f5f5` background.
- Footer (same `<Footer />` component as other pages).

---

## Landing Page Integration (`Home.jsx`)

Add a new section after the MyShots section:

```jsx
{/* ══════════════ SECTION 7: FRAMES (preview — 4 videos) ══════════════ */}
<div ref={framesRef}>
  <MyVideos
    limit={4}
    title="Frames"
    subtitle="Short cinematic moments — 5 to 10 seconds of light, motion & life."
  />
</div>
```

- Wrap in a `ref` for mobile swipe navigation (same pattern as other sections).
- Background: `#f5f5f5` (matches other home sections; video cards are dark `#111` providing contrast).

---

## Routing (`App.jsx`)

Add route:
```jsx
<Route path="/frames" element={<FramesPage />} />
```

---

## Admin Panel (`AdminPanel.jsx`)

New "Frames" tab section (after "My Shots"):

- **Hero video upload:** Cloudinary upload widget → saves to `site_settings.frames.hero_video`.
- **Video grid:** Same CRUD pattern as My Shots admin:
  - Per-card: Cloudinary video upload → `video_url`
  - Per-card: Supabase image upload (optional thumbnail override) → `thumb_url`
  - Title input, Category input
  - Aspect ratio dropdown: `9/16`, `16/9`, `1/1`, `4/3`, `4/5`
  - Sort order drag handle (same `sort_order` pattern)
  - Save button (`saveRow('my_videos', ...)`) + Delete button (`deleteRow('my_videos', id)`)
- **Add Video button:** creates new row `{ is_active: true, sort_order: nextOrder }`.
- Thumbnail auto-generated from Cloudinary — shows preview in admin card using `getThumb()`.
- Admin always sees the Cloudinary thumb immediately after video upload (no blank state).

---

## Design Tokens

All components use the existing site tokens — no deviations:

| Token | Value |
|---|---|
| Accent | `#ff4d00` |
| Background (light sections) | `#f5f5f5` |
| Background (dark sections) | `#000000` |
| Card background | `#111111` |
| Text | `#000` / `#fff` |
| Muted text | `#606060`, `#aaa` |
| Font | `"Geist", sans-serif` |
| Border radius (cards) | `8px` |
| Grid gap | `12px` |

---

## Animation Rules (matching site style)

- Card hover: MagneticCard tilt (`rotateX`, `rotateY` up to 12deg), `scale(1.02)`, `box-shadow` lifts.
- Play overlay fade: `opacity 0.2s ease`.
- Card meta (title/cat) reveal: `opacity 0 → 1`, `translateY 8px → 0`, `0.25s ease`.
- Lightbox open: `AnimatePresence`, backdrop `opacity 0→1 (0.25s)`, panel `scale 0.92→1 + opacity 0→1`, spring `stiffness:80, damping:18`.
- Section scroll reveal: same `opacity 0→1 + translateY 40px→0` pattern as rest of page.

---

## Hard Constraints

- `preload="none"` on all video elements — never preload on page load.
- Never `useState` on scroll handlers — use `rAF` + refs.
- Never `backdropFilter: blur()` inside video cards.
- Never per-card `useScroll()` — not needed here (no parallax on videos).
- Videos stored on **Cloudinary only**. Thumbnail overrides stored on **Supabase Storage**.
- Admin uses `directSaveField()` pattern — thumbnail saves immediately on upload.

---

## Files Changed

| File | Change |
|---|---|
| `src/components/MyVideos.jsx` | **NEW** — video masonry grid + lightbox |
| `src/pages/FramesPage.jsx` | **NEW** — hero video + full grid page |
| `src/pages/Home.jsx` | Add Frames section (section 7) |
| `src/App.jsx` | Add `/frames` route + lazy import |
| `src/pages/AdminPanel.jsx` | Add Frames admin section |
| Supabase | Create `my_videos` table + RLS policies |

---

## Out of Scope

- Drag-to-reorder in admin (sort_order set manually via number input, same as current My Shots).
- Video compression — Cloudinary handles this via the existing `portfolio_uploads` preset.
- Mobile swipe gestures on the lightbox (use native `<video controls>`).
