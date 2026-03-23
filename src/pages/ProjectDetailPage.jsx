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
      <BlurText
        text={text}
        animateBy="words"
        direction="bottom"
        delay={80}
        stepDuration={0.5}
        className=""
      />
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
  const map = { '16:9': '16/9', '4:3': '4/3', '1:1': '1/1', '9:16': '9/16', '21:9': '21/9' }
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

/* ── Parallax image — drifts on scroll ── */
function ParallaxMedia({ children, speed = 0.08 }) {
  const wrapRef = useRef()
  const innerRef = useRef()
  const rafRef = useRef()

  useEffect(() => {
    function onScroll() {
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        if (!wrapRef.current || !innerRef.current) return
        const rect = wrapRef.current.getBoundingClientRect()
        const centerOffset = rect.top + rect.height / 2 - window.innerHeight / 2
        innerRef.current.style.transform = `translateY(${centerOffset * speed}px) scale(1.12)`
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [speed])

  return (
    <div ref={wrapRef} style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <div ref={innerRef} style={{ width: '100%', height: '108%', willChange: 'transform', marginTop: '-4%' }}>
        {children}
      </div>
    </div>
  )
}

/* ── Video item with PLAY badge ── */
function VideoItem({ url, embedUrl, aspectRatio, animation, delay }) {
  const [playing, setPlaying] = useState(false)
  const videoRef = useRef()
  const ratio = getRatio(aspectRatio)

  // Extract YouTube/Vimeo embed src
  function getEmbedSrc(rawUrl) {
    if (!rawUrl) return null
    // YouTube
    const ytMatch = rawUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/)
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0`
    // Vimeo
    const vimeoMatch = rawUrl.match(/vimeo\.com\/(\d+)/)
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
    return null
  }

  const embedSrc = getEmbedSrc(embedUrl)

  const mediaContent = embedSrc ? (
    /* ── Embed player (YouTube/Vimeo) ── */
    <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#000' }}>
      <iframe
        src={embedSrc}
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
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
        muted
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

  return (
    <div style={{ width: '100%', aspectRatio: ratio, borderRadius: '16px', overflow: 'hidden', backgroundColor: '#111' }}>
      {embedSrc ? (
        /* Embeds don't need cinematic/parallax — they're iframes */
        mediaContent
      ) : animation === 'cinematic' ? (
        <CinematicReveal delay={delay}>{mediaContent}</CinematicReveal>
      ) : (
        <ParallaxMedia speed={0.06}>{mediaContent}</ParallaxMedia>
      )}
    </div>
  )
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
    <div style={{ width: '100%', aspectRatio: ratio, borderRadius: '16px', overflow: 'hidden', backgroundColor: '#ddd' }}>
      {animation === 'cinematic' ? (
        <CinematicReveal delay={delay}>{mediaContent}</CinematicReveal>
      ) : (
        <ParallaxMedia speed={0.04 + index * 0.01}>{mediaContent}</ParallaxMedia>
      )}
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
      {videos.length > 0 && (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 clamp(16px, 5vw, 40px) 60px' }}>
          <motion.h3
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={spring}
            style={{ fontFamily: '"Geist",sans-serif', fontSize: '13px', fontWeight: 500, color: '#aaa', margin: '0 0 24px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
          >Behind the Lens</motion.h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {videos.map((vid, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ ...spring, delay: 0.05 * i }}
              >
                <VideoItem
                  url={vid.url}
                  embedUrl={vid.embed_url}
                  aspectRatio={vid.aspect_ratio || '16:9'}
                  animation={animation}
                  delay={0.1 * i}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── Gallery Images ── */}
      {gallery.length > 0 && (
        <div style={{ maxWidth: project.image_display_style === 'circular' ? '100%' : '1400px', margin: '0 auto', padding: project.image_display_style === 'circular' ? '0 0 80px' : '0 clamp(16px, 5vw, 40px) 80px' }}>
          <motion.h3
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={spring}
            style={{ fontFamily: '"Geist",sans-serif', fontSize: '13px', fontWeight: 500, color: '#aaa', margin: '0 0 24px', textTransform: 'uppercase', letterSpacing: '0.1em', padding: project.image_display_style === 'circular' ? '0 clamp(16px, 5vw, 40px)' : '0' }}
          >Project Gallery</motion.h3>

          {project.image_display_style === 'circular' ? (
            /* ── Circular Gallery mode ── */
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
          ) : (
            /* ── Grid mode (parallax or cinematic) ── */
            <div className="gallery-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              {gallery.map((img, i) => {
                const url = typeof img === 'string' ? img : img?.url
                const ar = typeof img === 'object' ? img?.aspect_ratio : '16:9'
                if (!url) return null
                return (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 60 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.1 }}
                    transition={{ ...spring, delay: 0.06 * i }}
                    style={{ gridColumn: i === 0 ? 'span 2' : 'span 1' }}
                  >
                    <ImageItem
                      url={url}
                      aspectRatio={ar}
                      animation={animation}
                      delay={0.08 * i}
                      index={i}
                    />
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
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
        @media (max-width: 809px) {
          .project-info-grid { flex-direction: column !important; gap: 32px !important; }
          .project-info-grid > div:last-child { flex: 1 1 100% !important; padding-top: 0 !important; }
          .gallery-grid { grid-template-columns: 1fr !important; }
          .gallery-grid > div { grid-column: span 1 !important; }
        }
      `}</style>
    </div>
  )
}