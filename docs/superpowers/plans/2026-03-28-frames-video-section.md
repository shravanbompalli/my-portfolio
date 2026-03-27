# Frames Video Section — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Frames" cinematic video showcase — masonry grid with hover-play + lightbox, `/frames` page with hero video, landing preview section, and full admin CRUD.

**Architecture:** Parallel to MyShots — new `MyVideos.jsx` component, new `FramesPage.jsx`, new `my_videos` Supabase table. MagneticCard tilt reused from MyShots pattern. Videos lazy-load via IntersectionObserver (`preload="none"`, set src on first viewport intersection). Hover plays muted; click opens Framer Motion lightbox with audio.

**Tech Stack:** React 18, Framer Motion, Supabase JS v2, Cloudinary (videos), Vite

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/components/MyVideos.jsx` | **CREATE** | MagneticCard, VideoCard (lazy+hover), VideoLightbox, MyVideos grid |
| `src/pages/FramesPage.jsx` | **CREATE** | Hero with bg video, full MyVideos grid, Footer |
| `src/pages/Home.jsx` | **MODIFY** | Add section 7 — Frames preview (limit=4) |
| `src/App.jsx` | **MODIFY** | Import FramesPage + add `/frames` route |
| `src/pages/AdminPanel.jsx` | **MODIFY** | `videos` state, loadAll, Frames admin section |
| Supabase Dashboard | **SQL** | `my_videos` table + RLS + `frames` site_setting |

---

## Task 1: Create Supabase `my_videos` table + RLS

**Files:** Supabase Dashboard → SQL Editor

- [ ] **Step 1: Run table + RLS SQL**

Open Supabase Dashboard → SQL Editor → New Query. Paste and run:

```sql
-- Create table
create table if not exists my_videos (
  id           uuid primary key default gen_random_uuid(),
  title        text,
  category     text,
  video_url    text,
  thumb_url    text,
  aspect_ratio text default '16/9',
  sort_order   int  default 0,
  is_active    boolean default true,
  created_at   timestamptz default now()
);

-- Public read (anon) for active videos
create policy "Public read my_videos"
  on my_videos for select
  to anon
  using (is_active = true);

-- Authenticated full write
create policy "Admin write my_videos"
  on my_videos for all
  to authenticated
  using (true)
  with check (true);

-- Enable RLS
alter table my_videos enable row level security;

-- Insert a frames site_setting placeholder (hero video key)
insert into site_settings (key, value)
values ('frames', '{"hero_video": ""}')
on conflict (key) do nothing;
```

- [ ] **Step 2: Verify in Table Editor**

In Supabase Dashboard → Table Editor, confirm `my_videos` table exists with columns: `id, title, category, video_url, thumb_url, aspect_ratio, sort_order, is_active, created_at`.

- [ ] **Step 3: Commit checkpoint**

```bash
git add -A
git commit -m "chore: Supabase my_videos table + RLS (manual SQL applied)"
```

---

## Task 2: Create `src/components/MyVideos.jsx`

**Files:**
- Create: `src/components/MyVideos.jsx`

- [ ] **Step 1: Create the file**

Create `src/components/MyVideos.jsx` with the full content below.

Key design decisions:
- `MagneticCard` — exact same 3D tilt implementation as MyShots (stiffness:150, damping:20)
- `VideoCard` — `<img loading="lazy">` thumbnail + `<video preload="none">` with `data-src`
- `IntersectionObserver` sets `video.src` on first intersection (rootMargin `200px`)
- Hover → `video.play()` (guarded by `canplay`), unhover → `pause()` + `currentTime=0`
- Click → calls `onOpen(video_url)` to open lightbox
- `VideoLightbox` — `AnimatePresence`, dark overlay, `<video controls autoPlay>`, custom orange progress bar
- Grid: CSS columns masonry (same as MyShots), 3 cols → 2 on tablet → 1 on mobile

```jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { supabase } from '../lib/supabase'

const spring = { type: 'spring', stiffness: 70, damping: 12, mass: 0.8 }

/* ── Thumbnail helper ── */
function getThumb(videoUrl, thumbOverride) {
  if (thumbOverride) return thumbOverride
  if (!videoUrl) return null
  return videoUrl
    .replace('/upload/', '/upload/so_0,w_800/')
    .replace(/\.(mp4|mov|webm)(\?.*)?$/i, '.jpg')
}

/* ── MagneticCard — exact same 3D tilt as MyShots ── */
function MagneticCard({ children, i, isMobile }) {
  const ref = useRef(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const [isHovered, setIsHovered] = useState(false)

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), { stiffness: 150, damping: 20 })
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), { stiffness: 150, damping: 20 })

  function handleMouse(e) {
    if (isMobile || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5)
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  function handleLeave() {
    mouseX.set(0)
    mouseY.set(0)
    setIsHovered(false)
  }

  const directions = [
    { x: -60, y: 80, rotate: -4 },
    { x: 0,   y: 100, rotate: 0 },
    { x: 60,  y: 80,  rotate: 4 },
    { x: -40, y: 60,  rotate: -2 },
    { x: 20,  y: 90,  rotate: 1 },
    { x: -20, y: 70,  rotate: -3 },
  ]
  const dir = directions[i % directions.length]

  return (
    <motion.div
      ref={ref}
      initial={isMobile ? { opacity: 0, y: 30 } : { opacity: 0, y: dir.y, x: dir.x, rotate: dir.rotate, scale: 0.85, filter: 'blur(3px)' }}
      whileInView={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, y: 0, x: 0, rotate: 0, scale: 1, filter: 'blur(0px)' }}
      viewport={{ once: isMobile ? true : false, amount: 0.05 }}
      transition={isMobile
        ? { type: 'spring', stiffness: 60, damping: 14, mass: 0.8, delay: i * 0.06 }
        : { type: 'spring', stiffness: 40 + (i % 3) * 10, damping: 12, mass: 1 + (i % 3) * 0.4, delay: 0.06 * (i % 6) }
      }
      whileTap={isMobile ? { scale: 0.97 } : {}}
      onMouseMove={handleMouse}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleLeave}
      style={{ breakInside: 'avoid', marginBottom: 'clamp(12px, 2vw, 20px)', perspective: '800px', cursor: 'pointer', borderRadius: '12px', overflow: 'hidden' }}
    >
      <motion.div
        style={{
          rotateX: isMobile ? 0 : rotateX,
          rotateY: isMobile ? 0 : rotateY,
          borderRadius: '12px',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: isHovered
            ? '0 25px 60px rgba(0,0,0,0.25), 0 0 40px rgba(255,77,0,0.10)'
            : '0 4px 20px rgba(0,0,0,0.10)',
          transition: 'box-shadow 0.4s ease',
          transformStyle: 'preserve-3d',
        }}
      >
        {children(isHovered)}
        <motion.div
          animate={{ opacity: isHovered ? 0.04 : 0 }}
          transition={{ duration: 0.3 }}
          style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.5), transparent 70%)', pointerEvents: 'none' }}
        />
      </motion.div>
    </motion.div>
  )
}

/* ── VideoCard — lazy load + hover play + lightbox trigger ── */
function VideoCard({ video, i, isMobile, onOpen }) {
  const videoRef = useRef(null)
  const containerRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const thumb = getThumb(video.video_url, video.thumb_url)

  // IntersectionObserver: set video.src when card enters viewport
  useEffect(() => {
    if (!video.video_url) return
    const el = videoRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !el.src) {
          el.src = video.video_url
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [video.video_url])

  function handleMouseEnter() {
    const el = videoRef.current
    if (!el || !video.video_url) return
    // Set src if not set yet (direct hover before observer fires)
    if (!el.src) el.src = video.video_url
    const tryPlay = () => {
      el.play().then(() => setIsPlaying(true)).catch(() => {})
    }
    if (el.readyState >= 3) {
      tryPlay()
    } else {
      el.addEventListener('canplay', tryPlay, { once: true })
    }
  }

  function handleMouseLeave() {
    const el = videoRef.current
    if (!el) return
    el.pause()
    el.currentTime = 0
    setIsPlaying(false)
    setProgress(0)
  }

  function handleTimeUpdate() {
    const el = videoRef.current
    if (!el || !el.duration) return
    setProgress((el.currentTime / el.duration) * 100)
  }

  return (
    <MagneticCard i={i} isMobile={isMobile}>
      {(isHovered) => (
        <div
          ref={containerRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={() => onOpen(video)}
          style={{ position: 'relative', aspectRatio: video.aspect_ratio || '16/9', backgroundColor: '#111', overflow: 'hidden' }}
        >
          {/* Thumbnail */}
          {thumb && (
            <img
              src={thumb}
              alt={video.title || 'Frame'}
              loading="lazy"
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'cover',
                opacity: isPlaying ? 0 : 1,
                transition: 'opacity 0.3s ease',
              }}
            />
          )}

          {/* Video element */}
          <video
            ref={videoRef}
            muted
            loop
            playsInline
            preload="none"
            onTimeUpdate={handleTimeUpdate}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
              opacity: isPlaying ? 1 : 0,
              transition: 'opacity 0.3s ease',
            }}
          />

          {/* Placeholder when no video url */}
          {!video.video_url && !thumb && (
            <div style={{
              position: 'absolute', inset: 0,
              background: `linear-gradient(135deg, hsl(${i * 40 + 200}, 12%, 14%), hsl(${i * 40 + 200}, 12%, 8%))`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.5">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
          )}

          {/* Play button overlay */}
          <motion.div
            animate={{ opacity: isPlaying ? 0 : 1, scale: isHovered && !isPlaying ? 1.08 : 1 }}
            transition={{ duration: 0.2 }}
            style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}
          >
            <div style={{
              width: '48px', height: '48px',
              background: 'rgba(255,77,0,0.92)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(255,77,0,0.4)',
            }}>
              <svg width="16" height="18" viewBox="0 0 14 16" fill="none">
                <path d="M1 1L13 8L1 15V1Z" fill="white" />
              </svg>
            </div>
          </motion.div>

          {/* Progress bar (only when playing) */}
          <motion.div
            animate={{ opacity: isPlaying ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: 'rgba(255,255,255,0.15)', pointerEvents: 'none' }}
          >
            <div style={{ height: '100%', width: `${progress}%`, background: '#ff4d00', borderRadius: '2px', transition: 'width 0.1s linear' }} />
          </motion.div>

          {/* "PLAYING" label */}
          <motion.div
            animate={{ opacity: isPlaying ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '9px', fontFamily: '"Geist",sans-serif', fontWeight: 700, letterSpacing: '0.1em', color: '#ff4d00', background: 'rgba(0,0,0,0.6)', padding: '3px 7px', borderRadius: '3px', pointerEvents: 'none' }}
          >
            PLAYING
          </motion.div>

          {/* Category pill */}
          {video.category && (
            <motion.div
              animate={{ scale: isHovered ? 1.05 : 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              style={{ position: 'absolute', top: '12px', left: '12px', pointerEvents: 'none' }}
            >
              <span style={{ fontFamily: '"Geist",sans-serif', fontSize: '12px', fontWeight: 500, color: '#fff', backgroundColor: 'rgba(0,0,0,0.55)', padding: '5px 12px', borderRadius: '40px' }}>
                {video.category}
              </span>
            </motion.div>
          )}

          {/* Card meta — title + category on bottom hover */}
          <motion.div
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 15 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '28px 16px 16px', background: 'linear-gradient(transparent, rgba(0,0,0,0.75))', pointerEvents: 'none' }}
          >
            {video.title && (
              <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '15px', fontWeight: 500, color: '#fff', margin: 0 }}>{video.title}</p>
            )}
          </motion.div>
        </div>
      )}
    </MagneticCard>
  )
}

/* ── VideoLightbox — full screen player with audio ── */
function VideoLightbox({ video, onClose }) {
  const videoRef = useRef(null)
  const [progress, setProgress] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  function handleTimeUpdate() {
    const el = videoRef.current
    if (!el || !el.duration) return
    setCurrentTime(el.currentTime)
    setDuration(el.duration)
    setProgress((el.currentTime / el.duration) * 100)
  }

  function togglePlay() {
    const el = videoRef.current
    if (!el) return
    if (el.paused) { el.play(); setPlaying(true) }
    else { el.pause(); setPlaying(false) }
  }

  function handleProgressClick(e) {
    const el = videoRef.current
    if (!el || !el.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    el.currentTime = ratio * el.duration
  }

  function fmt(s) {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 80, damping: 18 }}
        style={{ width: '100%', maxWidth: '900px', background: '#111', borderRadius: '16px', overflow: 'hidden' }}
      >
        {/* Video */}
        <div style={{ position: 'relative', backgroundColor: '#000' }}>
          <video
            ref={videoRef}
            src={video.video_url}
            autoPlay
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setPlaying(false)}
            style={{ width: '100%', display: 'block', maxHeight: '70vh', objectFit: 'contain', background: '#000' }}
          />
        </div>

        {/* Controls */}
        <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '14px', borderTop: '1px solid #1e1e1e' }}>
          {/* Play/pause */}
          <button onClick={togglePlay} style={{ width: '36px', height: '36px', background: '#ff4d00', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {playing
              ? <svg width="12" height="14" viewBox="0 0 12 14" fill="white"><rect x="0" y="0" width="4" height="14"/><rect x="8" y="0" width="4" height="14"/></svg>
              : <svg width="12" height="14" viewBox="0 0 12 14" fill="white"><path d="M0 0L12 7L0 14V0Z"/></svg>
            }
          </button>

          {/* Progress bar (clickable) */}
          <div onClick={handleProgressClick} style={{ flex: 1, height: '4px', background: '#2a2a2a', borderRadius: '2px', cursor: 'pointer', position: 'relative' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: '#ff4d00', borderRadius: '2px', transition: 'width 0.1s linear' }} />
          </div>

          {/* Time */}
          <span style={{ fontFamily: '"Geist Mono",monospace', fontSize: '11px', color: '#666', flexShrink: 0 }}>
            {fmt(currentTime)} / {fmt(duration)}
          </span>

          {/* Title */}
          {video.title && (
            <span style={{ fontFamily: '"Geist",sans-serif', fontSize: '12px', color: '#aaa', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {video.title}
            </span>
          )}
        </div>
      </motion.div>

      {/* Close button */}
      <button
        onClick={onClose}
        style={{ position: 'absolute', top: '20px', right: '20px', width: '40px', height: '40px', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </motion.div>
  )
}

/* ── MyVideos — main export ── */
export default function MyVideos({ limit, title = 'Frames', subtitle }) {
  const [videos, setVideos] = useState([])

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('my_videos')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
      if (data) setVideos(data)
    }
    load()
  }, [])

  if (!videos.length) {
    const placeholders = [
      { id: 'p1', title: 'Golden Hour', category: 'Nature', aspect_ratio: '9/16', video_url: '', thumb_url: '' },
      { id: 'p2', title: 'City Pulse',  category: 'Urban',  aspect_ratio: '16/9', video_url: '', thumb_url: '' },
      { id: 'p3', title: 'Rain Study',  category: 'Macro',  aspect_ratio: '4/3',  video_url: '', thumb_url: '' },
      { id: 'p4', title: 'Long Exposure', category: 'Landscape', aspect_ratio: '16/9', video_url: '', thumb_url: '' },
    ]
    const showP = limit ? placeholders.slice(0, limit) : placeholders
    return <VideosSection videos={showP} limit={limit} title={title} subtitle={subtitle} hasMore={!!limit} />
  }

  const shown = limit ? videos.slice(0, limit) : videos
  const hasMore = limit && videos.length > limit

  return <VideosSection videos={shown} limit={limit} title={title} subtitle={subtitle} hasMore={hasMore} />
}

function VideosSection({ videos, limit, title, subtitle, hasMore }) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.matchMedia('(pointer: coarse)').matches : false
  )
  const [lightboxVideo, setLightboxVideo] = useState(null)

  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)')
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return (
    <section style={{ backgroundColor: '#f5f5f5', padding: 'clamp(60px, 8vw, 100px) clamp(18px, 4vw, 40px)' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: false, amount: 0.1 }}
          transition={spring}
          style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '20px', marginBottom: 'clamp(40px, 5vw, 64px)' }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
              <motion.span
                initial={{ opacity: 0, scale: 0.3, rotate: -30 }}
                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                viewport={{ once: false }}
                transition={{ type: 'spring', stiffness: 120, damping: 8, mass: 0.4 }}
                style={{ fontFamily: '"Geist", sans-serif', fontSize: 'clamp(60px, 8vw, 100px)', fontWeight: 500, color: '#ff4d00', lineHeight: '0.8', letterSpacing: '-0.02em', display: 'inline-block' }}
              >.</motion.span>
              <motion.h2
                initial={{ opacity: 0, x: -50, filter: 'blur(6px)' }}
                whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                viewport={{ once: false }}
                transition={{ ...spring, delay: 0.1 }}
                style={{ fontFamily: '"Geist", sans-serif', fontSize: 'clamp(32px, 5vw, 72px)', fontWeight: 500, color: '#000', lineHeight: 1, letterSpacing: '-0.02em', margin: 0 }}
              >{title}</motion.h2>
            </div>
            {subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false }}
                transition={{ ...spring, delay: 0.2 }}
                style={{ fontFamily: '"Geist", sans-serif', fontSize: 'clamp(14px, 1.5vw, 18px)', fontWeight: 400, color: '#404040', lineHeight: 1.6, maxWidth: '520px', margin: '16px 0 0' }}
              >{subtitle}</motion.p>
            )}
          </div>

          {hasMore && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false }}
              transition={{ ...spring, delay: 0.3 }}
            >
              <Link
                to="/frames"
                style={{ fontFamily: '"Geist", sans-serif', fontSize: '16px', fontWeight: 500, color: '#000', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', transition: 'color 0.3s ease' }}
                onMouseEnter={e => e.currentTarget.style.color = '#ff4d00'}
                onMouseLeave={e => e.currentTarget.style.color = '#000'}
              >
                View All Frames
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
                </svg>
              </Link>
            </motion.div>
          )}
        </motion.div>

        {/* Masonry grid */}
        <div className="videos-grid" style={{ columns: '3', columnGap: 'clamp(12px, 2vw, 20px)' }}>
          {videos.map((video, i) => (
            <VideoCard
              key={video.id}
              video={video}
              i={i}
              isMobile={isMobile}
              onOpen={setLightboxVideo}
            />
          ))}
        </div>

        {/* View All button */}
        {hasMore && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: false }}
            transition={{ type: 'spring', stiffness: 60, damping: 12, mass: 1, delay: 0.3 }}
            style={{ textAlign: 'center', marginTop: 'clamp(40px, 5vw, 60px)' }}
          >
            <motion.div
              whileHover={{ scale: 1.08, y: -3 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              style={{ display: 'inline-block' }}
            >
              <Link
                to="/frames"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', fontFamily: '"Geist",sans-serif', fontSize: '16px', fontWeight: 500, color: '#fff', backgroundColor: '#000', padding: '16px 36px', borderRadius: '100px', textDecoration: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', transition: 'background-color 0.3s ease, box-shadow 0.3s ease' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#ff4d00'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(255,77,0,0.3)' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#000'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)' }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0L9.8 6.2L16 8L9.8 9.8L8 16L6.2 9.8L0 8L6.2 6.2L8 0Z" />
                </svg>
                View All Frames
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
                </svg>
              </Link>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxVideo && (
          <VideoLightbox video={lightboxVideo} onClose={() => setLightboxVideo(null)} />
        )}
      </AnimatePresence>

      <style>{`
        @media (min-width: 810px) and (max-width: 1279px) { .videos-grid { columns: 2 !important; } }
        @media (max-width: 809px) { .videos-grid { columns: 1 !important; } }
      `}</style>
    </section>
  )
}
```

- [ ] **Step 2: Verify no import errors**

```bash
cd "C:/Users/91809/OneDrive/Desktop/AI_Projects/portfolio" && npm run build 2>&1 | tail -20
```

Expected: no errors mentioning `MyVideos.jsx`. Warnings about unused vars are OK.

- [ ] **Step 3: Commit**

```bash
git add src/components/MyVideos.jsx
git commit -m "feat: add MyVideos component — lazy video masonry + lightbox"
```

---

## Task 3: Create `src/pages/FramesPage.jsx`

**Files:**
- Create: `src/pages/FramesPage.jsx`

- [ ] **Step 1: Create the file**

```jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import MyVideos from '../components/MyVideos'
import Footer from '../components/Footer'
import BlurText from '../components/reactbits/BlurText'

export default function FramesPage() {
  const [brand, setBrand] = useState(null)
  const [contact, setContact] = useState(null)
  const [frames, setFrames] = useState(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['brand', 'contact', 'frames'])
      if (data) {
        data.forEach(r => {
          if (r.key === 'brand')   setBrand(r.value)
          if (r.key === 'contact') setContact(r.value)
          if (r.key === 'frames')  setFrames(r.value)
        })
      }
    }
    load()
    window.scrollTo(0, 0)
  }, [])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>

      {/* ── Navbar ── */}
      <div className="frames-page-nav" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        padding: 'clamp(12px, 4vw, 20px) clamp(16px, 5vw, 40px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
      }}>
        <div className="nav-contact" style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '180px' }}>
          {contact && <>
            <a href={`mailto:${contact.email}`} style={{ fontFamily: '"Geist",sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>{contact.email}</a>
            <span style={{ fontFamily: '"Geist",sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{contact.phone}</span>
          </>}
        </div>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: '"Geist",sans-serif', fontSize: '20px', fontWeight: 600, color: '#fff', letterSpacing: '0.05em' }}>
            ✦ {brand?.name || 'SHRAVAN'}
          </span>
        </Link>
        <div className="nav-info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', minWidth: '180px' }}>
          <span style={{ fontFamily: '"Geist",sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>{brand?.title || 'Cinematographer'}</span>
          <span style={{ fontFamily: '"Geist",sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{brand?.location || 'Hyderabad, India'}</span>
        </div>
      </div>

      {/* ── Hero: full-bleed VIDEO background ── */}
      <section style={{ position: 'relative', height: '100dvh', overflow: 'hidden', backgroundColor: '#000' }}>
        {/* Background video (or fallback gradient) */}
        {frames?.hero_video ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            src={frames.hero_video}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <motion.div
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 40, damping: 10 }}
            style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a00 100%)' }}
          />
        )}

        {/* Dark overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
          style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.52)', zIndex: 1 }}
        />

        {/* Content */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          padding: 'clamp(24px, 6vw, 80px)',
        }}>
          <div className="frames-headline-wrap" style={{
            fontSize: 'clamp(48px, 11vw, 148px)', fontWeight: 700,
            letterSpacing: '-0.04em', color: '#fff', lineHeight: 1, marginBottom: '16px',
          }}>
            <BlurText text="FRAMES" delay={100} animateBy="words" direction="bottom" />
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 60, damping: 14, delay: 0.5 }}
            style={{ fontFamily: '"Geist", sans-serif', fontSize: 'clamp(16px, 2vw, 22px)', color: 'rgba(255,255,255,0.7)', margin: '0 0 32px', lineHeight: 1.5 }}
          >
            Short cinematic moments — 5 to 10 seconds of light, motion and life.
          </motion.p>

          {/* Scroll indicator */}
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
            style={{ color: 'rgba(255,255,255,0.4)', width: '24px' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </motion.div>
        </div>
      </section>

      {/* ── All videos — no limit ── */}
      <MyVideos
        title="All Frames"
        subtitle="Every moment captured — short cinematic clips from the field."
      />

      <Footer />

      <style>{`
        .frames-headline-wrap p {
          font-size: inherit !important;
          font-weight: inherit !important;
          letter-spacing: inherit !important;
          line-height: inherit !important;
          color: inherit !important;
          font-family: "Geist", sans-serif !important;
        }
        @media (max-width: 809px) {
          .frames-page-nav { justify-content: center !important; }
          .nav-contact, .nav-info { display: none !important; }
          .frames-headline-wrap { font-size: clamp(32px, 10vw, 64px) !important; }
        }
      `}</style>
    </div>
  )
}
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | tail -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/FramesPage.jsx
git commit -m "feat: add FramesPage — hero video background + full video grid"
```

---

## Task 4: Add `/frames` route to `App.jsx`

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add import**

In `src/App.jsx`, add this import directly after the `MyShotsPage` import (line ~12):

```js
import FramesPage from './pages/FramesPage'
```

- [ ] **Step 2: Add route**

In the `<Routes>` block, add the `/frames` route directly after the `/my-shots` route:

```jsx
<Route path="/my-shots" element={<MyShotsPage />} />
<Route path="/frames" element={<FramesPage />} />
```

- [ ] **Step 3: Build check**

```bash
npm run build 2>&1 | tail -20
```

- [ ] **Step 4: Dev server smoke test**

```bash
npm run dev
```

Open `http://localhost:5173/frames` — should see the Frames page (gradient hero if no video set yet, then empty grid).

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add /frames route to App.jsx"
```

---

## Task 5: Add Frames preview section to `Home.jsx`

**Files:**
- Modify: `src/pages/Home.jsx`

- [ ] **Step 1: Add MyVideos import**

Near the top of `src/pages/Home.jsx` add:

```js
import MyVideos from '../components/MyVideos'
```

- [ ] **Step 2: Add `framesRef`**

In the refs block (near line 54 where `myShotsRef` is declared), add:

```js
const framesRef = useRef()
```

- [ ] **Step 3: Add `framesRef` to the swipe navigation sections array**

Find this line (around line 134):

```js
const sections = [servicesRef, portfolioRef, myShotsRef].filter(r => r.current)
```

Replace with:

```js
const sections = [servicesRef, portfolioRef, myShotsRef, framesRef].filter(r => r.current)
```

- [ ] **Step 4: Add the Frames section**

Find the SECTION 7 comment (Footer CTA):

```jsx
      {/* ══════════════ SECTION 7: FOOTER CTA ══════════════ */}
      <Footer />
```

Replace with:

```jsx
      {/* ══════════════ SECTION 7: FRAMES (preview — 4 videos) ══════════════ */}
      <div ref={framesRef}><MyVideos
        limit={4}
        title="Frames"
        subtitle="Short cinematic moments — 5 to 10 seconds of light, motion & life."
      /></div>

      {/* ══════════════ SECTION 8: FOOTER CTA ══════════════ */}
      <Footer />
```

- [ ] **Step 5: Build + smoke test**

```bash
npm run build 2>&1 | tail -20
```

Open `http://localhost:5173` — scroll down past My Shots, confirm the Frames section appears with placeholder cards.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Home.jsx
git commit -m "feat: add Frames preview section (4 videos) to Home.jsx"
```

---

## Task 6: Add Frames section to `AdminPanel.jsx`

**Files:**
- Modify: `src/pages/AdminPanel.jsx`

- [ ] **Step 1: Add `videos` state**

Find the state declarations block (around line 456):

```js
const [shots, setShots] = useState([])
```

Add after it:

```js
const [videos, setVideos] = useState([])
```

- [ ] **Step 2: Add `my_videos` to `loadAll`**

Find `loadAll` (around line 472). The current destructuring is:

```js
const [s, sv, p, r, f, sh, c, m] = await Promise.all([
  supabase.from('site_settings').select('*'),
  supabase.from('services').select('*').order('sort_order'),
  supabase.from('projects').select('*').order('sort_order'),
  supabase.from('reviews').select('*').order('sort_order'),
  supabase.from('faqs').select('*').order('sort_order'),
  supabase.from('my_shots').select('*').order('sort_order'),
  supabase.from('collaborations').select('*').order('sort_order'),
  supabase.from('contact_messages').select('*').order('created_at', { ascending: false }),
])
```

Replace with (add `my_videos` as `v`):

```js
const [s, sv, p, r, f, sh, v, c, m] = await Promise.all([
  supabase.from('site_settings').select('*'),
  supabase.from('services').select('*').order('sort_order'),
  supabase.from('projects').select('*').order('sort_order'),
  supabase.from('reviews').select('*').order('sort_order'),
  supabase.from('faqs').select('*').order('sort_order'),
  supabase.from('my_shots').select('*').order('sort_order'),
  supabase.from('my_videos').select('*').order('sort_order'),
  supabase.from('collaborations').select('*').order('sort_order'),
  supabase.from('contact_messages').select('*').order('created_at', { ascending: false }),
])
```

- [ ] **Step 3: Wire up `setVideos`**

In the lines after the `Promise.all` (around line 488), find:

```js
if (sh.data) setShots(sh.data)
if (c.data) setCollabs(c.data)
```

Add between them:

```js
if (sh.data) setShots(sh.data)
if (v.data) setVideos(v.data)
if (c.data) setCollabs(c.data)
```

- [ ] **Step 4: Add Frames admin section**

Find the closing `</Section>` of the "MY SHOTS" section (line ~1397):

```jsx
        </Section>

        {/* ═══ REVIEWS ═══ */}
```

Insert the entire Frames section between them:

```jsx
        </Section>

        {/* ═══ FRAMES ═══ */}
        <Section title="🎬 Frames" badge={videos.length}>
          <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '11px', color: gray, margin: '0 0 6px', textTransform: 'uppercase' }}>Frames Page Hero Video</p>
          <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '11px', color: '#666', margin: '0 0 12px' }}>
            This video plays on loop behind the "FRAMES" headline on the /frames page.
          </p>
          <VideoUploader
            value={settings.frames?.value?.hero_video}
            label="Frames Hero Video"
            height="160px"
            onUpload={url => saveImage('frames', 'hero_video', url)}
          />
          {settings.frames?.value?.hero_video && (
            <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
              <Btn onClick={() => saveImage('frames', 'hero_video', '')} variant="danger" small>Remove Video</Btn>
              <a href={settings.frames?.value?.hero_video} target="_blank" rel="noopener"
                style={{ fontFamily: '"Geist",sans-serif', fontSize: '12px', color: '#a855f7', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                Preview ↗
              </a>
            </div>
          )}
          <div style={{ marginTop: '20px' }} />

          {/* Video grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
            {videos.map((v, i) => (
              <div key={v.id} style={{ borderRadius: '10px', overflow: 'hidden', border: `1px solid ${border}`, backgroundColor: '#0d0d0d' }}>
                <VideoUploader value={v.video_url} label="Video" height="160px"
                  onUpload={url => { const u = [...videos]; u[i] = { ...u[i], video_url: url }; setVideos(u); saveRow('my_videos', u[i]) }} />
                <div style={{ padding: '8px' }}>
                  <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '10px', color: gray, margin: '0 0 4px', textTransform: 'uppercase' }}>Thumbnail override (optional)</p>
                  <ImageUploader value={v.thumb_url} folder="frames" label="Thumb" height="60px"
                    onUpload={url => { const u = [...videos]; u[i] = { ...u[i], thumb_url: url }; setVideos(u); saveRow('my_videos', u[i]) }} />
                  <input value={v.title || ''} placeholder="Title" onChange={e => { const u = [...videos]; u[i].title = e.target.value; setVideos(u) }}
                    style={{ width: '100%', fontFamily: '"Geist",sans-serif', fontSize: '11px', color: white, backgroundColor: 'transparent', border: 'none', outline: 'none', padding: '4px 0', borderBottom: `1px solid ${border}`, marginTop: '6px' }} />
                  <input value={v.category || ''} placeholder="Category / Tag" onChange={e => { const u = [...videos]; u[i].category = e.target.value; setVideos(u) }}
                    style={{ width: '100%', fontFamily: '"Geist",sans-serif', fontSize: '11px', color: accent, backgroundColor: 'transparent', border: 'none', outline: 'none', padding: '4px 0', marginTop: '4px', borderBottom: `1px solid ${border}` }} />
                  <select value={v.aspect_ratio || '16/9'} onChange={e => { const u = [...videos]; u[i].aspect_ratio = e.target.value; setVideos(u) }}
                    style={{ width: '100%', fontFamily: '"Geist",sans-serif', fontSize: '10px', color: gray, backgroundColor: '#0d0d0d', border: `1px solid ${border}`, borderRadius: '4px', padding: '4px', marginTop: '6px', outline: 'none' }}>
                    <option value="16/9">Landscape (16:9)</option>
                    <option value="9/16">Portrait (9:16)</option>
                    <option value="1/1">Square (1:1)</option>
                    <option value="4/3">Standard (4:3)</option>
                    <option value="4/5">Instagram (4:5)</option>
                  </select>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                    <Btn onClick={() => saveRow('my_videos', videos[i])} small>Save</Btn>
                    <Btn onClick={() => deleteRow('my_videos', v.id)} variant="danger" small>×</Btn>
                  </div>
                </div>
              </div>
            ))}
            {/* Add Video button */}
            <div onClick={() => saveRow('my_videos', { title: '', category: '', video_url: '', thumb_url: '', aspect_ratio: '16/9', sort_order: videos.length + 1, is_active: true })}
              style={{ height: '160px', borderRadius: '10px', border: `2px dashed ${border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: '4px', transition: 'border-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = accent}
              onMouseLeave={e => e.currentTarget.style.borderColor = border}>
              <span style={{ fontSize: '20px', color: gray }}>🎬</span>
              <span style={{ fontFamily: '"Geist",sans-serif', fontSize: '11px', color: gray }}>+ Frame</span>
            </div>
          </div>
        </Section>

        {/* ═══ REVIEWS ═══ */}
```

- [ ] **Step 5: Build check**

```bash
npm run build 2>&1 | tail -20
```

Expected: no errors.

- [ ] **Step 6: Smoke test admin panel**

```bash
npm run dev
```

Open `http://localhost:5173/admin`, log in. Scroll to "🎬 Frames" section — verify hero video uploader and "+ Frame" add button appear.

- [ ] **Step 7: Commit**

```bash
git add src/pages/AdminPanel.jsx
git commit -m "feat: add Frames admin section — hero video + video CRUD grid"
```

---

## Task 7: Final verification + push branch

- [ ] **Step 1: Full build**

```bash
npm run build 2>&1
```

Expected: `✓ built in` — zero errors.

- [ ] **Step 2: Lint**

```bash
npm run lint 2>&1 | tail -30
```

Fix any errors (not warnings).

- [ ] **Step 3: End-to-end smoke test**

Start dev server: `npm run dev`

Verify each route:
1. `http://localhost:5173/` — scroll down, Frames section visible with 4 placeholder cards
2. `http://localhost:5173/frames` — hero (gradient if no video), then empty grid
3. `http://localhost:5173/admin` — Frames section present, hero video upload + grid

- [ ] **Step 4: Push branch**

```bash
git push -u origin feat/frames-video-section
```

- [ ] **Step 5: Open PR**

```bash
gh pr create \
  --title "feat: Frames video section — masonry grid, lightbox, hero video, admin CRUD" \
  --body "$(cat <<'EOF'
## Summary
- New \`my_videos\` Supabase table with RLS (anon read, auth write)
- \`MyVideos.jsx\` — masonry grid with hover-play (muted, lazy-loaded via IntersectionObserver) and click-to-lightbox with audio
- \`FramesPage.jsx\` — full-viewport hero with looping background video (\`/frames\` route)
- Home.jsx section 7 — 4-video preview with "View All Frames" link
- AdminPanel.jsx Frames section — hero video upload, per-video CRUD (Cloudinary + optional Supabase thumb override, aspect ratio, title, category)

## Test plan
- [ ] Upload a video in Admin → Frames section, verify it appears on /frames
- [ ] Hover over a video card — muted preview plays, progress bar animates
- [ ] Click a card — lightbox opens with audio, play/pause and progress work
- [ ] Set an optional thumbnail override in admin — verify custom thumb shows
- [ ] Visit / — scroll to Frames section, 4 cards visible
- [ ] "View All Frames" button navigates to /frames
- [ ] /frames hero shows gradient fallback when no hero video set
- [ ] Upload hero video in admin — /frames hero plays video on loop

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-Review Notes

- **Spec coverage:** ✅ `my_videos` table, RLS, thumbnail logic, `MyVideos.jsx`, `VideoCard`, `VideoLightbox`, `FramesPage`, hero video, Home.jsx section, App.jsx route, AdminPanel Frames section — all covered.
- **No placeholders:** All steps have complete code.
- **Type consistency:** `getThumb(videoUrl, thumbOverride)` used consistently in VideoCard. `saveRow('my_videos', ...)` and `deleteRow('my_videos', id)` match AdminPanel helpers exactly. `videos` state / `setVideos` consistent throughout Task 6.
- **Loading safety:** `preload="none"` set in VideoCard JSX. IntersectionObserver sets `el.src` only once. Hover guarded by `readyState >= 3 || canplay` event. Lightbox uses direct `src` prop (no lazy needed — user explicitly opened it).
