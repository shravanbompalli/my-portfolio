import { useState, useEffect, useRef } from 'react'
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
            ? '0 25px 60px rgba(0,0,0,0.2), 0 0 40px rgba(255,77,0,0.08)'
            : '0 4px 20px rgba(0,0,0,0.06)',
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
  const tryPlayRef = useRef(null)
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
    if (!el.src) el.src = video.video_url
    const tryPlay = () => {
      el.play().then(() => setIsPlaying(true)).catch(() => {})
    }
    tryPlayRef.current = tryPlay
    if (el.readyState >= 3) {
      tryPlay()
    } else {
      el.addEventListener('canplay', tryPlay, { once: true })
    }
  }

  function handleMouseLeave() {
    const el = videoRef.current
    if (!el) return
    if (tryPlayRef.current) {
      el.removeEventListener('canplay', tryPlayRef.current)
      tryPlayRef.current = null
    }
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

          {/* PLAYING label */}
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

          {/* Card meta */}
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

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

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
    el.currentTime = ((e.clientX - rect.left) / rect.width) * el.duration
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

        <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '14px', borderTop: '1px solid #1e1e1e' }}>
          <button onClick={togglePlay} style={{ width: '36px', height: '36px', background: '#ff4d00', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {playing
              ? <svg width="12" height="14" viewBox="0 0 12 14" fill="white"><rect x="0" y="0" width="4" height="14"/><rect x="8" y="0" width="4" height="14"/></svg>
              : <svg width="12" height="14" viewBox="0 0 12 14" fill="white"><path d="M0 0L12 7L0 14V0Z"/></svg>
            }
          </button>

          <div onClick={handleProgressClick} style={{ flex: 1, height: '4px', background: '#2a2a2a', borderRadius: '2px', cursor: 'pointer' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: '#ff4d00', borderRadius: '2px', transition: 'width 0.1s linear' }} />
          </div>

          <span style={{ fontFamily: '"Geist Mono",monospace', fontSize: '11px', color: '#666', flexShrink: 0 }}>
            {fmt(currentTime)} / {fmt(duration)}
          </span>

          {video.title && (
            <span style={{ fontFamily: '"Geist",sans-serif', fontSize: '12px', color: '#aaa', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {video.title}
            </span>
          )}
        </div>
      </motion.div>

      <button
        onClick={onClose}
        aria-label="Close"
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

function VideosSection({ videos, title, subtitle, hasMore }) {
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
