import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion'
import { supabase } from '../lib/supabase'

const spring = { type: 'spring', stiffness: 70, damping: 12, mass: 0.8 }

/*
  MagneticCard — 3D tilt card that follows cursor
  Creates a premium interactive feel where cards tilt toward your mouse
*/
function MagneticCard({ children, i, isMobile }) {
  const ref = useRef(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const [isHovered, setIsHovered] = useState(false)

  // Smooth spring-dampened rotation
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), { stiffness: 150, damping: 20 })
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), { stiffness: 150, damping: 20 })

  function handleMouse(e) {
    if (isMobile) return
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    mouseX.set(x)
    mouseY.set(y)
  }

  function handleLeave() {
    mouseX.set(0)
    mouseY.set(0)
    setIsHovered(false)
  }

  // Entry animation — each card comes from a different direction
  const directions = [
    { x: -60, y: 80, rotate: -4 },   // left + down + tilt left
    { x: 0, y: 100, rotate: 0 },     // straight up
    { x: 60, y: 80, rotate: 4 },     // right + down + tilt right
    { x: -40, y: 60, rotate: -2 },   // gentle left
    { x: 20, y: 90, rotate: 1 },     // slight right
    { x: -20, y: 70, rotate: -3 },   // slight left
  ]
  const dir = directions[i % directions.length]

  return (
    <motion.div
      ref={ref}
      initial={isMobile ? { opacity: 0, y: 30 } : {
        opacity: 0,
        y: dir.y,
        x: dir.x,
        rotate: dir.rotate,
        scale: 0.85,
        filter: 'blur(3px)',
      }}
      whileInView={isMobile ? { opacity: 1, y: 0 } : {
        opacity: 1,
        y: 0,
        x: 0,
        rotate: 0,
        scale: 1,
        filter: 'blur(0px)',
      }}
      viewport={{ once: isMobile ? true : false, amount: 0.05 }}
      transition={isMobile
        ? { type: 'spring', stiffness: 60, damping: 14, mass: 0.8, delay: i * 0.06 }
        : {
          type: 'spring',
          stiffness: 40 + (i % 3) * 10,
          damping: 12,
          mass: 1 + (i % 3) * 0.4,
          delay: 0.06 * (i % 6),
        }
      }
      whileTap={isMobile ? { scale: 0.97 } : {}}
      onMouseMove={handleMouse}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleLeave}
      style={{
        breakInside: 'avoid',
        marginBottom: 'clamp(12px, 2vw, 20px)',
        perspective: '800px',
        cursor: 'pointer',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
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

        {/* Subtle light on hover — no color tint */}
        <motion.div
          animate={{ opacity: isHovered ? 0.04 : 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.5), transparent 70%)',
            pointerEvents: 'none',
          }}
        />
      </motion.div>
    </motion.div>
  )
}

/*
  ParallaxImage — image moves slightly on scroll for depth effect
*/
function ParallaxImage({ src, videoSrc, mediaType, alt, aspect, i, isHovered, isMobile, scrollY }) {
  const ref = useRef(null)
  const [inputRange, setInputRange] = useState([0, 1])

  useLayoutEffect(() => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const top = rect.top + window.scrollY
    setInputRange([top - window.innerHeight, top + rect.height])
  }, [])

  const yRange = isMobile
    ? [12 + (i % 3) * 4, -12 - (i % 3) * 4]
    : [30 + (i % 3) * 10, -30 - (i % 3) * 10]
  const y = useTransform(scrollY, inputRange, yRange)

  return (
    <div ref={ref} style={{ overflow: 'hidden' }}>
      <motion.div
        style={{ y }}
        animate={{
          scale: isHovered ? 1.1 : 1.02,
          filter: isHovered ? 'saturate(1.1) brightness(1.02)' : 'saturate(1) brightness(1)',
        }}
        transition={{ type: 'spring', stiffness: 150, damping: 20 }}
      >
        {mediaType === 'video' && videoSrc ? (
          <video
            src={videoSrc}
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: '100%', display: 'block',
              aspectRatio: aspect || '3/4',
              objectFit: 'cover',
            }}
          />
        ) : src ? (
          <img
            src={src}
            alt={alt}
            style={{
              width: '100%', display: 'block',
              aspectRatio: aspect || '3/4',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div style={{
            width: '100%', aspectRatio: aspect || '3/4',
            background: `linear-gradient(135deg, hsl(${i * 30 + 200}, 12%, 78%), hsl(${i * 30 + 200}, 12%, 62%))`,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            <span style={{ fontFamily: '"Geist",sans-serif', fontSize: '12px', color: '#aaa' }}>
              {alt}
            </span>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default function MyShots({ limit, title = 'See Through My Lens', subtitle }) {
  const [shots, setShots] = useState([])

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('my_shots')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
      if (data) setShots(data)
    }
    load()
  }, [])

  if (!shots.length) {
    const placeholders = [
      { id: 'p1', title: 'Golden Hour Portrait', category: 'Portrait', aspect_ratio: '3/4' },
      { id: 'p2', title: 'Wedding Ceremony', category: 'Wedding', aspect_ratio: '4/3' },
      { id: 'p3', title: 'Urban Street Style', category: 'Street', aspect_ratio: '3/4' },
      { id: 'p4', title: 'Nature & Landscape', category: 'Landscape', aspect_ratio: '4/3' },
      { id: 'p5', title: 'Event Highlights', category: 'Event', aspect_ratio: '3/4' },
      { id: 'p6', title: 'Studio Session', category: 'Studio', aspect_ratio: '4/3' },
      { id: 'p7', title: 'Candid Moments', category: 'Candid', aspect_ratio: '3/4' },
      { id: 'p8', title: 'Travel Photography', category: 'Travel', aspect_ratio: '4/3' },
    ]
    const showP = limit ? placeholders.slice(0, limit) : placeholders
    return <ShotsSection shots={showP} limit={limit} title={title} subtitle={subtitle} hasMore={!!limit} />
  }

  const shown = limit ? shots.slice(0, limit) : shots
  const hasMore = limit && shots.length > limit

  return <ShotsSection shots={shown} limit={limit} title={title} subtitle={subtitle} hasMore={hasMore} />
}

function ShotsSection({ shots, limit, title, subtitle, hasMore }) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.matchMedia('(pointer: coarse)').matches : false
  )
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)')
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Single shared scroll listener for all parallax images
  const { scrollY } = useScroll()

  return (
    <section
      style={{
        backgroundColor: '#f5f5f5',
        padding: 'clamp(60px, 8vw, 100px) clamp(18px, 4vw, 40px)',
      }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

        {/* ── Header with animated elements ── */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: false, amount: 0.1 }}
          transition={spring}
          style={{
            display: 'flex', flexWrap: 'wrap',
            justifyContent: 'space-between', alignItems: 'flex-end',
            gap: '20px', marginBottom: 'clamp(40px, 5vw, 64px)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
              <motion.span
                initial={{ opacity: 0, scale: 0.3, rotate: -30 }}
                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                viewport={{ once: false }}
                transition={{ type: 'spring', stiffness: 120, damping: 8, mass: 0.4 }}
                style={{
                  fontFamily: '"Geist", sans-serif',
                  fontSize: 'clamp(60px, 8vw, 100px)',
                  fontWeight: 500, color: '#ff4d00',
                  lineHeight: '0.8', letterSpacing: '-0.02em',
                  display: 'inline-block',
                }}
              >.</motion.span>
              <motion.h2
                initial={{ opacity: 0, x: -50, filter: 'blur(6px)' }}
                whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                viewport={{ once: false }}
                transition={{ ...spring, delay: 0.1 }}
                style={{
                  fontFamily: '"Geist", sans-serif',
                  fontSize: 'clamp(32px, 5vw, 72px)',
                  fontWeight: 500, color: '#000',
                  lineHeight: 1, letterSpacing: '-0.02em', margin: 0,
                }}
              >{title}</motion.h2>
            </div>
            {subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false }}
                transition={{ ...spring, delay: 0.2 }}
                style={{
                  fontFamily: '"Geist", sans-serif',
                  fontSize: 'clamp(14px, 1.5vw, 18px)',
                  fontWeight: 400, color: '#404040',
                  lineHeight: 1.6, maxWidth: '520px', margin: '16px 0 0',
                }}
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
                to="/my-shots"
                style={{
                  fontFamily: '"Geist", sans-serif',
                  fontSize: '16px', fontWeight: 500,
                  color: '#000', textDecoration: 'none',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  transition: 'color 0.3s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#ff4d00'}
                onMouseLeave={e => e.currentTarget.style.color = '#000'}
              >
                View All Shots
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
                </svg>
              </Link>
            </motion.div>
          )}
        </motion.div>

        {/* ── Masonry grid with MagneticCards + Parallax ── */}
        <div className="shots-grid" style={{ columns: '3', columnGap: 'clamp(12px, 2vw, 20px)' }}>
          {shots.map((shot, i) => (
            <MagneticCard key={shot.id} i={i} isMobile={isMobile}>
              {(isHovered) => (
                <>
                  <ParallaxImage
                    src={shot.image_url}
                    videoSrc={shot.video_url}
                    mediaType={shot.media_type}
                    alt={shot.title || 'Photo'}
                    aspect={shot.aspect_ratio}
                    i={i}
                    isHovered={isHovered}
                    isMobile={isMobile}
                    scrollY={scrollY}
                  />

                  {/* Hover overlay — slides up with blur backdrop */}
                  <motion.div
                    animate={{
                      opacity: isHovered ? (isMobile ? 0.85 : 1) : (isMobile ? 0.85 : 0),
                      y: (isMobile || isHovered) ? 0 : 15,
                    }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      padding: '28px 16px 16px',
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
                      pointerEvents: 'none',
                    }}
                  >
                    {shot.title && (
                      <p style={{
                        fontFamily: '"Geist",sans-serif', fontSize: '15px',
                        fontWeight: 500, color: '#fff', margin: 0,
                      }}>{shot.title}</p>
                    )}
                    {shot.category && (
                      <p style={{
                        fontFamily: '"Geist",sans-serif', fontSize: '12px',
                        color: 'rgba(255,255,255,0.7)', margin: '4px 0 0',
                      }}>{shot.category}</p>
                    )}
                  </motion.div>

                  {/* Category pill — top left, always visible */}
                  {shot.category && (
                    <motion.div
                      animate={{ scale: isHovered ? 1.05 : 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      style={{
                        position: 'absolute', top: '12px', left: '12px',
                        pointerEvents: 'none',
                      }}
                    >
                      <span style={{
                        fontFamily: '"Geist",sans-serif', fontSize: '12px',
                        fontWeight: 500, color: '#fff',
                        backgroundColor: 'rgba(0,0,0,0.55)',
                        padding: '5px 12px', borderRadius: '40px',
                      }}>
                        {shot.category}
                      </span>
                    </motion.div>
                  )}
                </>
              )}
            </MagneticCard>
          ))}
        </div>

        {/* ── View All button ── */}
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
                to="/my-shots"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '10px',
                  fontFamily: '"Geist",sans-serif', fontSize: '16px', fontWeight: 500,
                  color: '#fff', backgroundColor: '#000',
                  padding: '16px 36px', borderRadius: '100px',
                  textDecoration: 'none',
                  transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = '#ff4d00'
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(255,77,0,0.3)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = '#000'
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0L9.8 6.2L16 8L9.8 9.8L8 16L6.2 9.8L0 8L6.2 6.2L8 0Z" />
                </svg>
                View All Shots
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
                </svg>
              </Link>
            </motion.div>
          </motion.div>
        )}
      </div>

      <style>{`
        @media (min-width: 810px) and (max-width: 1279px) { .shots-grid { columns: 2 !important; } }
        @media (max-width: 809px) { .shots-grid { columns: 1 !important; } }
      `}</style>
    </section>
  )
}