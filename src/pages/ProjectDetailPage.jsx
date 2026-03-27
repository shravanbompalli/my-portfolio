import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { supabase } from '../lib/supabase'
import Footer from '../components/Footer'
import CircularGallery from '../components/CircularGallery'
import BlurText from '../components/reactbits/BlurText'
import GradientText from '../components/reactbits/GradientText'
import FuzzyText from '../components/reactbits/FuzzyText'
import FadeReveal from '../components/reactbits/FadeReveal'

const spring = { type: 'spring', stiffness: 70, damping: 12, mass: 0.8 }

/* ── Animated heading — swaps style based on site_settings.animations.heading ── */
function AnimatedHeading({ text, style, animStyle }) {
  if (animStyle === 'blur') {
    return (
      <div style={style} className="anim-heading-blur">
        <BlurText
          text={text}
          animateBy="words"
          direction="bottom"
          delay={80}
          stepDuration={0.5}
          className=""
        />
      </div>
    )
  }
  if (animStyle === 'gradient') {
    return (
      <GradientText
        colors={['#ff4d00', '#000', '#ff4d00']}
        animationSpeed={6}
        className=""
      >
        <span style={style}>{text}</span>
      </GradientText>
    )
  }
  if (animStyle === 'fuzzy') {
    return (
      <FuzzyText
        fontSize={style?.fontSize || 'clamp(32px,5vw,56px)'}
        fontWeight={style?.fontWeight || 600}
        color="#000"
        baseIntensity={0.12}
        hoverIntensity={0.4}
      >
        {text}
      </FuzzyText>
    )
  }
  if (animStyle === 'fade') {
    return (
      <FadeReveal>
        <h1 style={style}>{text}</h1>
      </FadeReveal>
    )
  }
  // 'none' or anything else — plain
  return <h1 style={style}>{text}</h1>
}

/* ── Aspect ratio string to CSS value ── */
function getRatio(ar) {
  if (!ar || ar === 'auto') return 'auto'
  if (ar.includes('/')) return ar // already CSS format e.g. '16/9', '4/5'
  const map = {
    '16:9': '16/9', '4:3': '4/3', '1:1': '1/1', '9:16': '9/16',
    '21:9': '21/9', '3:4': '3/4', '2:3': '2/3', '4:5': '4/5', '3:2': '3/2',
  }
  return map[ar] || '16/9'
}

/* ── Cinematic Reveal — horizontal wipe left→right ── */
function CinematicReveal({ children, delay = 0 }) {
  const ref = useRef()
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setRevealed(true); observer.disconnect() } },
      { threshold: 0.15 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', overflow: 'hidden', width: '100%', height: '100%' }}>
      {/* Black overlay wipes away left→right */}
      <div style={{
        position: 'absolute', inset: 0, backgroundColor: '#000', zIndex: 2,
        transform: revealed ? 'translateX(100%)' : 'translateX(0%)',
        transition: `transform 1.1s cubic-bezier(0.77, 0, 0.175, 1) ${delay}s`,
        transformOrigin: 'left center',
      }} />
      {/* Content fades in slightly after wipe starts */}
      <div style={{
        opacity: revealed ? 1 : 0,
        transition: `opacity 0.4s ease ${delay + 0.3}s`,
        width: '100%', height: '100%',
      }}>
        {children}
      </div>
    </div>
  )
}

/* ── Parallax image — drifts on scroll (desktop only) ── */
function ParallaxMedia({ children, speed = 0.08 }) {
  const wrapRef = useRef()
  const innerRef = useRef()
  const rafRef = useRef()
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 809px)').matches

  useEffect(() => {
    if (isMobile) return // skip parallax on mobile — prevents jank
    function onScroll() {
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        if (!wrapRef.current || !innerRef.current) return
        const rect = wrapRef.current.getBoundingClientRect()
        const centerOffset = rect.top + rect.height / 2 - window.innerHeight / 2
        innerRef.current.style.transform = `translateY(${centerOffset * speed}px)`
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [speed, isMobile])

  return (
    <div ref={wrapRef} style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* 120% height + -10% marginTop gives 10% overflow buffer each side — enough for parallax
          without forcing a permanent scale/zoom on the image itself */}
      <div ref={innerRef} style={{ width: '100%', height: isMobile ? '100%' : '120%', willChange: isMobile ? 'auto' : 'transform', marginTop: isMobile ? '0' : '-10%' }}>
        {children}
      </div>
    </div>
  )
}

/* ── Video item with PLAY badge ── */
function VideoItem({ url, embedUrl, aspectRatio, animation, delay }) {
  const [playing, setPlaying] = useState(false)
  const [iframeActive, setIframeActive] = useState(false)
  const videoRef = useRef()
  const ratio = getRatio(aspectRatio)

  // Extract YouTube/Vimeo embed src — whitelist only trusted domains
  function getEmbedSrc(rawUrl) {
    if (!rawUrl) return null
    let parsed
    try { parsed = new URL(rawUrl) } catch { return null }
    if (!['https:', 'http:'].includes(parsed.protocol)) return null
    const host = parsed.hostname.replace(/^www\./, '')
    // YouTube
    if (host === 'youtube.com' || host === 'youtu.be') {
      const v = host === 'youtu.be'
        ? parsed.pathname.slice(1)
        : (parsed.searchParams.get('v') || parsed.pathname.replace('/embed/', ''))
      if (/^[a-zA-Z0-9_-]{11}$/.test(v)) return `https://www.youtube.com/embed/${v}?autoplay=0&rel=0`
    }
    // Vimeo
    if (host === 'vimeo.com') {
      const v = parsed.pathname.replace('/', '')
      if (/^\d+$/.test(v)) return `https://player.vimeo.com/video/${v}`
    }
    return null
  }

  const embedSrc = getEmbedSrc(embedUrl)

  const mediaContent = embedSrc ? (
    /* ── Embed player (YouTube/Vimeo) ── */
    <div
      style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#000' }}
      onMouseLeave={() => setIframeActive(false)}
    >
      <iframe
        src={embedSrc}
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
      {/* Transparent overlay — blocks iframe from swallowing scroll events.
          Removed on click so YouTube controls still work; restored on mouse-leave. */}
      {!iframeActive && (
        <div
          onClick={() => setIframeActive(true)}
          style={{ position: 'absolute', inset: 0, cursor: 'pointer', zIndex: 1 }}
        />
      )}
    </div>
  ) : (
    /* ── Cloudinary direct video ── */
    <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#000', cursor: 'pointer' }}
      onClick={() => {
        setPlaying(!playing)
        if (videoRef.current) {
          playing ? videoRef.current.pause() : videoRef.current.play()
        }
      }}>
      <video
        ref={videoRef}
        src={url}
        loop
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: playing ? 0 : 1, transition: 'opacity 0.3s ease',
        background: 'rgba(0,0,0,0.3)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
            border: '2px solid rgba(255,255,255,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <polygon points="6,3 20,12 6,21" />
            </svg>
          </div>
          <span style={{
            fontFamily: '"Geist Mono",monospace', fontSize: '11px', fontWeight: 600,
            color: '#fff', letterSpacing: '0.2em',
            background: 'rgba(0,0,0,0.5)', padding: '4px 12px', borderRadius: '20px',
          }}>PLAY</span>
        </div>
      </div>
    </div>
  )

  // Portrait videos (9:16, 3:4, etc.) cap height like a phone reel so they fit in one scroll.
  // Landscape / square use the normal full-column-width sizing.
  const PORTRAIT_RATIOS = new Set(['9/16', '2/3', '3/4', '4/5'])
  const isPortraitVideo = PORTRAIT_RATIOS.has(ratio)

  const containerStyle = isPortraitVideo
    ? { maxHeight: 'clamp(480px, 65vh, 600px)', aspectRatio: ratio, width: 'auto', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#111' }
    : { width: '100%', ...(ratio !== 'auto' && { aspectRatio: ratio }), borderRadius: '16px', overflow: 'hidden', backgroundColor: '#111' }

  return (
    <div style={containerStyle}>
      {embedSrc ? (
        mediaContent
      ) : animation === 'cinematic' ? (
        <CinematicReveal delay={delay}>{mediaContent}</CinematicReveal>
      ) : (
        <ParallaxMedia speed={0.06}>{mediaContent}</ParallaxMedia>
      )}
    </div>
  )
}

/* ── Detect portrait aspect ratio ── */
function isPortrait(ar) {
  const portraits = new Set(['9:16', '2:3', '3:4', '4:5', '9/16', '2/3', '3/4', '4/5'])
  return portraits.has(ar)
}

/* ── Auto-select column count: 3 if majority are portrait, else 2 ── */
function getGalleryCols(images) {
  if (!images?.length) return 2
  const portraitCount = images.filter(img => isPortrait(typeof img === 'object' ? img?.aspect_ratio : null)).length
  return portraitCount > images.length / 2 ? 3 : 2
}

/* ── Image item ── */
function ImageItem({ url, aspectRatio, animation, delay, index }) {
  const ratio = getRatio(aspectRatio)

  const mediaContent = (
    <img
      src={url}
      alt={`Gallery ${index + 1}`}
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'saturate(1.3)' }}
    />
  )

  return (
    <div style={{ width: '100%', ...(ratio !== 'auto' && { aspectRatio: ratio }), borderRadius: '16px', overflow: 'hidden', backgroundColor: '#ddd' }}>
      {animation === 'cinematic' ? (
        <CinematicReveal delay={delay}>{mediaContent}</CinematicReveal>
      ) : (
        <ParallaxMedia speed={0.04 + index * 0.01}>{mediaContent}</ParallaxMedia>
      )}
    </div>
  )
}

/* ── Stack Gallery — adaptive layout based on aspect ratio ── */
function StackGallery({ images, animation }) {
  const cols = getGalleryCols(images)

  // Portrait (3-col): uniform 3-per-row grid
  if (cols === 3) {
    const rows = []
    for (let i = 0; i < images.length; i += 3) rows.push(images.slice(i, i + 3))
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {rows.map((row, r) => (
          <div key={r} style={{ display: 'grid', gridTemplateColumns: `repeat(${row.length}, 1fr)`, gap: '16px' }}>
            {row.map((img, j) => {
              const url = typeof img === 'string' ? img : img?.url
              const ar = typeof img === 'object' ? img?.aspect_ratio : '9:16'
              if (!url) return null
              return (
                <motion.div key={j}
                  initial={{ opacity: 0, y: 60 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.08 }}
                  transition={{ ...spring, delay: 0.08 * j }}
                >
                  <ImageItem url={url} aspectRatio={ar} animation={animation} delay={0.06 * j} index={r * 3 + j} />
                </motion.div>
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  // Landscape (2-col): span-driven rows — full-width items solo, half-width items pair up
  function norm(img) {
    if (!img) return { url: '', aspect_ratio: '16:9', span: 1 }
    if (typeof img === 'string') return { url: img, aspect_ratio: '16:9', span: 1 }
    return { url: img.url || '', aspect_ratio: img.aspect_ratio || '16:9', span: img.span ?? 1 }
  }
  const rows = []
  let i = 0
  while (i < images.length) {
    const img = norm(images[i])
    if (img.span === 2) {
      rows.push([images[i]])
      i++
    } else {
      const next = images[i + 1] ? norm(images[i + 1]) : null
      if (next && next.span !== 2) {
        rows.push([images[i], images[i + 1]])
        i += 2
      } else {
        rows.push([images[i]])
        i++
      }
    }
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {rows.map((row, r) => (
        <div key={r} style={{ display: 'grid', gridTemplateColumns: `repeat(${row.length}, 1fr)`, gap: '16px' }}>
          {row.map((img, j) => {
            const url = typeof img === 'string' ? img : img?.url
            const ar = typeof img === 'object' ? img?.aspect_ratio : (row.length === 1 ? '16:9' : '4:5')
            if (!url) return null
            return (
              <motion.div key={j}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.08 }}
                transition={{ ...spring, delay: 0.08 * j }}
              >
                <ImageItem url={url} aspectRatio={ar} animation={animation} delay={0.06 * j} index={images.indexOf(img)} />
              </motion.div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

/* ── Infinite Gallery Strip — auto-scrolling horizontal strip ── */
function InfiniteGalleryStrip({ images }) {
  const trackRef = useRef()
  const animRef = useRef()
  const posRef = useRef(0)
  const pausedRef = useRef(false)

  useEffect(() => {
    function tick() {
      if (!pausedRef.current && trackRef.current) {
        posRef.current -= 0.6
        const half = trackRef.current.scrollWidth / 2
        if (Math.abs(posRef.current) >= half) posRef.current = 0
        trackRef.current.style.transform = `translateX(${posRef.current}px)`
      }
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  const doubled = [...images, ...images]

  return (
    <div
      style={{ overflow: 'hidden', width: '100%', cursor: 'grab' }}
      onMouseEnter={() => { pausedRef.current = true }}
      onMouseLeave={() => { pausedRef.current = false }}
    >
      <div ref={trackRef} style={{ display: 'flex', gap: '16px', width: 'max-content' }}>
        {doubled.map((img, i) => {
          const url = typeof img === 'string' ? img : img?.url
          if (!url) return null
          return (
            <div key={i} style={{ flexShrink: 0, height: '420px', width: '560px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#ddd' }}>
              <img src={url} alt={`Shot ${i + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'saturate(1.3)', pointerEvents: 'none' }} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── BTS Video Strip — dark full-width card at end of project ── */
function BTSStrip({ videoUrl, title }) {
  const [playing, setPlaying] = useState(false)
  const videoRef = useRef()
  const stripRef = useRef()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.2 }
    )
    if (stripRef.current) observer.observe(stripRef.current)
    return () => observer.disconnect()
  }, [])

  function toggle() {
    if (!videoRef.current) return
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {}) // catch browser autoplay rejection silently
    } else {
      videoRef.current.pause()
    }
  }

  return (
    <div ref={stripRef} style={{
      width: '100%', backgroundColor: '#0a0a0a',
      padding: 'clamp(40px,6vw,80px) clamp(16px,5vw,40px)',
      margin: '0 0 0',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Label */}
        <div style={{
          opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
          marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px',
        }}>
          <span style={{
            fontFamily: '"Geist Mono",monospace', fontSize: '11px', fontWeight: 700,
            color: '#ff4d00', letterSpacing: '0.25em', textTransform: 'uppercase',
            border: '1px solid #ff4d00', padding: '4px 12px', borderRadius: '40px',
          }}>BTS</span>
          <span style={{ fontFamily: '"Geist",sans-serif', fontSize: '13px', color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Behind The Scenes
          </span>
        </div>

        {/* 2-col layout */}
        <div className="bts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(24px,4vw,60px)', alignItems: 'center' }}>

          {/* Left — video player */}
          <div style={{
            opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(-40px)',
            transition: 'opacity 0.8s ease 0.15s, transform 0.8s ease 0.15s',
          }}>
            <div
              onClick={toggle}
              style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#111', cursor: 'pointer' }}
            >
              <video
                ref={videoRef}
                src={videoUrl}
                loop
                playsInline
                preload="none"
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => setPlaying(false)}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              {/* Play / Pause overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                background: playing ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: playing ? 0 : 1, transition: 'opacity 0.4s ease',
              }}>
                <div style={{
                  width: '72px', height: '72px', borderRadius: '50%',
                  backgroundColor: 'rgba(255,77,0,0.15)',
                  border: '2px solid #ff4d00',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'transform 0.3s ease',
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="#ff4d00">
                    <polygon points="6,3 20,12 6,21" />
                  </svg>
                </div>
              </div>
              {/* Playing indicator */}
              {playing && (
                <div
                  onClick={toggle}
                  style={{
                    position: 'absolute', bottom: '16px', right: '16px',
                    fontFamily: '"Geist Mono",monospace', fontSize: '11px', fontWeight: 700,
                    color: '#fff', letterSpacing: '0.15em',
                    background: 'rgba(0,0,0,0.6)', padding: '4px 12px', borderRadius: '20px',
                    cursor: 'pointer',
                  }}>
                  ■ STOP
                </div>
              )}
            </div>
          </div>

          {/* Right — text */}
          <div style={{
            opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(40px)',
            transition: 'opacity 0.8s ease 0.3s, transform 0.8s ease 0.3s',
          }}>
            <h2 style={{
              fontFamily: '"Geist",sans-serif',
              fontSize: 'clamp(28px,3.5vw,48px)',
              fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1,
              color: '#fff', margin: '0 0 20px',
            }}>
              {title}
            </h2>
            <p style={{
              fontFamily: '"Geist",sans-serif', fontSize: 'clamp(14px,1.2vw,16px)',
              fontWeight: 400, color: '#666', lineHeight: 1.75, margin: '0 0 32px',
              maxWidth: '440px',
            }}>
              A raw look at what it takes to craft this project — the light chasing, the setups, and the moments between shots.
            </p>
            <button
              onClick={toggle}
              style={{
                fontFamily: '"Geist",sans-serif', fontSize: '14px', fontWeight: 600,
                color: playing ? '#666' : '#000',
                backgroundColor: playing ? 'transparent' : '#ff4d00',
                border: playing ? '1px solid #333' : 'none',
                padding: '12px 28px', borderRadius: '40px',
                cursor: 'pointer', letterSpacing: '0.04em',
                transition: 'all 0.3s ease',
              }}
            >
              {playing ? 'Pause BTS' : '▶  Watch BTS'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 809px) {
          .bts-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

export default function ProjectDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [allProjects, setAllProjects] = useState([])
  const [brand, setBrand] = useState(null)
  const [contact, setContact] = useState(null)
  const [headingAnim, setHeadingAnim] = useState('blur')
  const coverRef = useRef()

  useEffect(() => {
    async function load() {
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
      if (projects) {
        setAllProjects(projects)
        const found = projects.find(p => p.slug === slug)
        if (found) setProject(found)
        else navigate('/portfolio', { replace: true })
      }
      // Tell Lenis to recalculate scroll height after async content loads
      setTimeout(() => window.dispatchEvent(new Event('resize')), 150)
      const { data: settings } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['brand', 'contact', 'animations'])
      if (settings) {
        settings.forEach(r => {
          if (r.key === 'brand') setBrand(r.value)
          if (r.key === 'contact') setContact(r.value)
          if (r.key === 'animations') setHeadingAnim(r.value?.heading || 'blur')
        })
      }
    }
    load()
    window.scrollTo(0, 0)
  }, [slug, navigate])

  if (!project) return null

  const currentIndex = allProjects.findIndex(p => p.slug === slug)
  const prevProject = currentIndex > 0 ? allProjects[currentIndex - 1] : null
  const nextProject = currentIndex < allProjects.length - 1 ? allProjects[currentIndex + 1] : null

  const gallery = (project.gallery_images || [])
  const videos = (project.gallery_videos || [])
  const animation = project.gallery_animation || 'parallax'
  const isFullBleed = project.image_display_style === 'circular' || project.image_display_style === 'infinite'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>

      {/* ── Navbar ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        padding: 'clamp(12px, 4vw, 20px) clamp(16px, 5vw, 40px)', borderBottom: '1px solid rgba(0,0,0,0.06)',
        position: 'sticky', top: 0, zIndex: 50, backgroundColor: '#f5f5f5',
      }}>
        <div className="nav-contact" style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '180px' }}>
          {contact && <>
            <a href={`mailto:${contact.email}`} style={{ fontFamily: '"Geist",sans-serif', fontSize: '14px', color: '#404040', textDecoration: 'none' }}>{contact.email}</a>
            <span style={{ fontFamily: '"Geist",sans-serif', fontSize: '12px', color: '#aaa' }}>{contact.phone}</span>
          </>}
        </div>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: '"Geist",sans-serif', fontSize: '20px', fontWeight: 600, color: '#000', letterSpacing: '0.05em' }}>
            ✦ {brand?.name || 'SHRAVAN'}
          </span>
        </Link>
        <div className="nav-info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', minWidth: '180px' }}>
          <span style={{ fontFamily: '"Geist",sans-serif', fontSize: '14px', color: '#404040' }}>{brand?.title || 'Cinematographer'}</span>
          <span style={{ fontFamily: '"Geist",sans-serif', fontSize: '12px', color: '#aaa' }}>{brand?.location || 'Hyderabad, India'}</span>
        </div>
      </div>

      {/* ── Back link ── */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px clamp(16px, 5vw, 40px) 0' }}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={spring}>
          <Link to="/portfolio"
            style={{ fontFamily: '"Geist",sans-serif', fontSize: '14px', fontWeight: 500, color: '#606060', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'color 0.3s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#ff4d00'}
            onMouseLeave={e => e.currentTarget.style.color = '#606060'}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
            </svg>
            Back to Portfolio
          </Link>
        </motion.div>
      </div>

      {/* ── Hero Cover Image ── */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px clamp(16px, 5vw, 40px)' }}>
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...spring, delay: 0.1 }}
          style={{ width: '100%', aspectRatio: '16/9', borderRadius: '20px', overflow: 'hidden', backgroundColor: '#ddd' }}
        >
          <div ref={coverRef} style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            {project.cover_image ? (
              <ParallaxMedia speed={0.12}>
                <img src={project.cover_image} alt={project.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'saturate(1.4)' }} />
              </ParallaxMedia>
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#e0dcd8,#c8c4c0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: '"Geist",sans-serif', fontSize: '18px', color: '#aaa' }}>Project Cover</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Project Info ── */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px clamp(16px, 5vw, 40px) 60px' }}>
        <div className="project-info-grid" style={{ display: 'flex', gap: '60px' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.2 }} style={{ flex: '1 1 60%' }}
          >
            <span style={{
              fontFamily: '"Geist",sans-serif', fontSize: '13px', fontWeight: 400,
              color: '#fff', backgroundColor: '#000', padding: '6px 14px',
              borderRadius: '40px', display: 'inline-block', marginBottom: '20px',
            }}>{project.category}</span>
            <AnimatedHeading
              text={project.title}
              animStyle={headingAnim}
              style={{
                fontFamily: '"Geist",sans-serif', fontSize: 'clamp(32px,5vw,56px)',
                fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.1, color: '#000', margin: '0 0 20px',
              }}
            />
            <p style={{
              fontFamily: '"Geist",sans-serif', fontSize: 'clamp(15px,1.5vw,18px)',
              fontWeight: 400, color: '#404040', lineHeight: 1.7, margin: 0, maxWidth: '600px',
            }}>{project.description}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.3 }}
            style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column', gap: '24px', paddingTop: '40px' }}
          >
            {project.client && (
              <div>
                <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '12px', fontWeight: 500, color: '#aaa', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client</p>
                <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '16px', fontWeight: 500, color: '#000', margin: 0 }}>{project.client}</p>
              </div>
            )}
            {project.date && (
              <div>
                <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '12px', fontWeight: 500, color: '#aaa', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</p>
                <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '16px', fontWeight: 500, color: '#000', margin: 0 }}>{project.date}</p>
              </div>
            )}
            {project.location && (
              <div>
                <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '12px', fontWeight: 500, color: '#aaa', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Location</p>
                <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '16px', fontWeight: 500, color: '#000', margin: 0 }}>{project.location}</p>
              </div>
            )}
            <div>
              <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '12px', fontWeight: 500, color: '#aaa', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</p>
              <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '16px', fontWeight: 500, color: '#000', margin: 0 }}>{project.category}</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Gallery Videos ── */}
      {videos.length > 0 && (() => {
        // Group consecutive portrait videos side-by-side (max 4 per row), landscape solo
        const PORTRAIT_VID = new Set(['9:16', '2:3', '3:4', '4:5', '9/16', '2/3', '3/4', '4/5'])
        const groups = []
        let vi = 0
        while (vi < videos.length) {
          const ar = videos[vi].aspect_ratio || '16:9'
          if (PORTRAIT_VID.has(ar)) {
            const row = []
            while (vi < videos.length && PORTRAIT_VID.has(videos[vi].aspect_ratio || '16:9') && row.length < 4) {
              row.push(videos[vi++])
            }
            groups.push({ portrait: true, items: row })
          } else {
            groups.push({ portrait: false, items: [videos[vi++]] })
          }
        }
        return (
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 clamp(16px, 5vw, 40px) 60px' }}>
            <motion.h3
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={spring}
              style={{ fontFamily: '"Geist",sans-serif', fontSize: '13px', fontWeight: 500, color: '#aaa', margin: '0 0 24px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
            >Behind the Lens</motion.h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {groups.map((group, g) => (
                <motion.div key={g}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.08 }}
                  transition={{ ...spring, delay: 0.05 * g }}
                  style={group.portrait
                    ? { display: 'flex', gap: '16px', justifyContent: 'center', alignItems: 'flex-start' }
                    : {}
                  }
                >
                  {group.items.map((vid, j) => (
                    <VideoItem
                      key={j}
                      url={vid.url}
                      embedUrl={vid.embed_url}
                      aspectRatio={vid.aspect_ratio || '16:9'}
                      animation={animation}
                      delay={0.08 * j}
                    />
                  ))}
                </motion.div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* ── Gallery Images ── */}
      {gallery.length > 0 && (
        <div style={{ maxWidth: isFullBleed ? '100%' : '1400px', margin: '0 auto', padding: isFullBleed ? '0 0 80px' : '0 clamp(16px, 5vw, 40px) 80px' }}>
          <motion.h3
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={spring}
            style={{ fontFamily: '"Geist",sans-serif', fontSize: '13px', fontWeight: 500, color: '#aaa', margin: '0 0 24px', textTransform: 'uppercase', letterSpacing: '0.1em', padding: isFullBleed ? '0 clamp(16px, 5vw, 40px)' : '0' }}
          >Project Gallery</motion.h3>

          {project.image_display_style === 'circular' ? (
            /* ── Circular Gallery ── */
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              style={{ height: '600px', position: 'relative', width: '100%' }}
            >
              <CircularGallery
                items={gallery
                  .filter(img => typeof img === 'string' ? img : img?.url)
                  .map((img, i) => ({
                    image: typeof img === 'string' ? img : img?.url,
                    text: `${project.title} ${i + 1}`
                  }))}
                bend={1}
                textColor="#ffffff"
                borderRadius={0.05}
                scrollSpeed={2}
                scrollEase={0.05}
              />
            </motion.div>

          ) : project.image_display_style === 'stack' ? (
            /* ── Stack: alternating full-width and 2-col rows ── */
            <StackGallery images={gallery} animation={animation} />

          ) : project.image_display_style === 'infinite' ? (
            /* ── Infinite: auto-scrolling horizontal strip ── */
            <InfiniteGalleryStrip images={gallery} />

          ) : (
            /* ── Parallax Grid (default) — CSS columns masonry ── */
            (() => {
              const cols = getGalleryCols(gallery)
              return (
                <div className="gallery-grid" style={{ columns: cols, columnGap: '20px' }}>
                  {gallery.map((img, i) => {
                    const url = typeof img === 'string' ? img : img?.url
                    const ar = typeof img === 'object' ? img?.aspect_ratio : '16:9'
                    if (!url) return null
                    const imgObj = typeof img === 'object' ? img : { url: img, aspect_ratio: '16:9', span: 1 }
                    const spanFull = imgObj.span === 2 && cols === 2
                    return (
                      <motion.div key={i}
                        initial={{ opacity: 0, y: 60 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.1 }}
                        transition={{ ...spring, delay: 0.06 * i }}
                        style={{
                          breakInside: 'avoid',
                          marginBottom: '20px',
                          display: 'block',
                          ...(spanFull && { columnSpan: 'all' }),
                        }}
                      >
                        <ImageItem url={url} aspectRatio={ar} animation={animation} delay={0.08 * i} index={i} />
                      </motion.div>
                    )
                  })}
                </div>
              )
            })()
          )}
        </div>
      )}

      {/* ── BTS Video Strip ── */}
      {project.video_url && (
        <BTSStrip videoUrl={project.video_url} title={project.title} />
      )}

      {/* ── Next / Prev ── */}
      <div style={{
        maxWidth: '1400px', margin: '0 auto', padding: '40px clamp(16px, 5vw, 40px) 80px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderTop: '1px solid rgba(0,0,0,0.1)',
      }}>
        {prevProject ? (
          <Link to={`/portfolio/${prevProject.slug}`}
            style={{ fontFamily: '"Geist",sans-serif', fontSize: '15px', fontWeight: 500, color: '#000', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', transition: 'color 0.3s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#ff4d00'}
            onMouseLeave={e => e.currentTarget.style.color = '#000'}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
            {prevProject.title}
          </Link>
        ) : <div />}
        {nextProject ? (
          <Link to={`/portfolio/${nextProject.slug}`}
            style={{ fontFamily: '"Geist",sans-serif', fontSize: '15px', fontWeight: 500, color: '#000', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', transition: 'color 0.3s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#ff4d00'}
            onMouseLeave={e => e.currentTarget.style.color = '#000'}>
            {nextProject.title}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>
          </Link>
        ) : <div />}
      </div>

      <Footer />

      <style>{`
        .anim-heading-blur p {
          font-size: inherit !important;
          font-weight: inherit !important;
          letter-spacing: inherit !important;
          line-height: inherit !important;
          color: inherit !important;
          font-family: inherit !important;
          margin: 0 0 20px !important;
        }
        @media (max-width: 809px) {
          .nav-contact, .nav-info { display: none !important; }
          .project-info-grid { flex-direction: column !important; gap: 32px !important; }
          .project-info-grid > div:last-child { flex: 1 1 100% !important; padding-top: 0 !important; }
          .gallery-grid { columns: 1 !important; }
        }
      `}</style>
    </div>
  )
}