import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

function GridLines({ color = 'rgba(255,255,255,0.05)' }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-[2]">
      <div className="h-full max-w-full mx-auto flex">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex-1"
            style={{ borderLeft: `1px solid ${color}`, opacity: i === 3 ? 0 : 1 }} />
        ))}
      </div>
    </div>
  )
}

function ArrowUpRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      style={{ transform: 'rotate(45deg)' }}>
      <path d="M12 19V5" />
      <path d="M5 12l7-7 7 7" />
    </svg>
  )
}

export default function Hero() {
  const [hero, setHero] = useState(null)
  const [social, setSocial] = useState(null)
  const [awards, setAwards] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [counter, setCounter] = useState(0)
  const timerRef = useRef()
  const bgRef = useRef()
  const contentRef = useRef()
  const heroRef = useRef()
  const rafRef = useRef()
  const loadedRef = useRef(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['hero', 'social', 'awards'])
      if (data) {
        data.forEach(r => {
          if (r.key === 'hero') setHero(r.value)
          if (r.key === 'social') setSocial(r.value)
          if (r.key === 'awards') setAwards(r.value)
        })
      }
      setTimeout(() => {
        setLoaded(true)
        loadedRef.current = true
      }, 100)
    }
    load()
  }, [])

  // Scroll parallax — direct DOM, no re-renders, 60fps
  useEffect(() => {
    function onScroll() {
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        if (!heroRef.current) return
        const rect = heroRef.current.getBoundingClientRect()
        if (rect.bottom <= 0) return

        const scrolled = window.scrollY
        if (contentRef.current) {
          contentRef.current.style.transform = `translateY(${scrolled * -0.15}px)`
        }
        if (bgRef.current && loadedRef.current) {
          bgRef.current.style.transform = `scale(1) translateY(${scrolled * 0.3}px)`
        }
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Awards counter animation
  useEffect(() => {
    if (!loaded || !awards?.count) return
    const target = parseInt(awards.count) || 0
    const dur = 1500
    const steps = 30
    const inc = target / steps
    let current = 0
    timerRef.current = setInterval(() => {
      current += inc
      if (current >= target) {
        setCounter(target)
        clearInterval(timerRef.current)
      } else {
        setCounter(Math.floor(current))
      }
    }, dur / steps)
    return () => clearInterval(timerRef.current)
  }, [loaded, awards])

  // Determine which background to show
  const showVideo = hero?.hero_mode === 'video' && hero?.hero_video

  return (
    <section id="hero" ref={heroRef} className="relative w-full overflow-hidden"
      style={{ height: '100vh', background: '#000' }}>

      {/* BG — Video or Image based on hero_mode toggle */}
      <figure ref={bgRef} className="absolute inset-0"
        style={{
          transform: loaded ? 'scale(1)' : 'scale(1.5)',
          transition: loaded ? 'none' : 'transform 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s',
          willChange: 'transform',
          margin: 0,
        }}>

        {showVideo ? (
          <video
            src={hero.hero_video}
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : hero?.bg_image ? (
          <img src={hero.bg_image}
            alt="Hero background"
            className="w-full h-full object-cover"
            style={{ display: 'block' }} />
        ) : (
          <div className="w-full h-full"
            style={{ background: 'radial-gradient(ellipse at center, #1a1a1a 0%, #000 100%)' }} />
        )}
      </figure>

      {/* Grid Lines */}
      <GridLines />

      {/* Hero content — parallax: pushes up on scroll */}
      <div ref={contentRef} className="absolute inset-0 z-[3] flex flex-col justify-end"
        style={{ padding: '0 0 0 0', willChange: 'transform' }}>

        {/* Tagline */}
        <div className="flex-1 flex flex-col justify-end"
          style={{ padding: '0 40px 24px' }}>
          <div style={{
            opacity: loaded ? 1 : 0.001,
            transform: loaded ? 'translateY(0)' : 'translateY(40px)',
            transition: 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            transitionDelay: '0.6s',
          }}>
            <p style={{
              fontFamily: '"Geist", sans-serif',
              fontSize: 'clamp(18px, 2.5vw, 28px)',
              fontWeight: 500,
              color: '#eee',
              letterSpacing: '-0.01em',
              lineHeight: 1.3,
            }}>
              {hero?.tagline || 'Award-winning creative'}
            </p>
          </div>
        </div>

        {/* Headline */}
        <div style={{
          padding: '0 40px',
          opacity: loaded ? 1 : 0.001,
          transform: loaded ? 'translateY(0)' : 'translateY(60px)',
          transition: 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          transitionDelay: '0.4s',
        }}>
          <h1 style={{
            fontFamily: '"Geist", sans-serif',
            fontSize: 'clamp(48px, 12vw, 156px)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: '100%',
            color: '#fff',
            mixBlendMode: 'difference',
            margin: 0,
          }}>
            {hero?.headline || 'CINEMATOGRAPHER'}
          </h1>
        </div>

        {/* Bottom bar */}
        <div className="w-full flex flex-col md:flex-row"
          style={{
            opacity: loaded ? 1 : 0.001,
            transform: loaded ? 'translateY(0)' : 'translateY(-40px)',
            transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            transitionDelay: '0.8s',
          }}>
          <div className="w-full flex flex-col md:flex-row items-stretch">

            <div className="hidden md:block flex-1"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />

            <div className="flex-1 flex items-center gap-6"
              style={{
                borderTop: '1px solid rgba(255,255,255,0.05)',
                borderLeft: '1px solid rgba(255,255,255,0.05)',
                padding: '20px 24px',
              }}>
              {social?.instagram && (
                <a href={social.instagram} target="_blank" rel="noopener"
                  className="flex items-center gap-2 group"
                  style={{ textDecoration: 'none', color: '#fff' }}>
                  <span className="transition-colors duration-200 group-hover:text-[#ff4d00]">
                    <ArrowUpRight />
                  </span>
                  <span style={{
                    fontFamily: '"Geist", sans-serif',
                    fontSize: 'clamp(14px, 1.5vw, 18px)',
                    fontWeight: 400, color: 'inherit',
                  }} className="transition-colors duration-200 group-hover:text-[#ff4d00]">
                    Instagram
                  </span>
                </a>
              )}
              {social?.youtube && (
                <a href={social.youtube} target="_blank" rel="noopener"
                  className="flex items-center gap-2 group"
                  style={{ textDecoration: 'none', color: '#fff' }}>
                  <span className="transition-colors duration-200 group-hover:text-[#ff4d00]">
                    <ArrowUpRight />
                  </span>
                  <span style={{
                    fontFamily: '"Geist", sans-serif',
                    fontSize: 'clamp(14px, 1.5vw, 18px)',
                    fontWeight: 400, color: 'inherit',
                  }} className="transition-colors duration-200 group-hover:text-[#ff4d00]">
                    YouTube
                  </span>
                </a>
              )}
            </div>

            <div className="hidden md:flex flex-1 items-center"
              style={{
                borderTop: '1px solid rgba(255,255,255,0.05)',
                borderLeft: '1px solid rgba(255,255,255,0.05)',
                padding: '20px 24px',
              }}>
              <p style={{
                fontFamily: '"Geist", sans-serif',
                fontSize: 'clamp(13px, 1.2vw, 16px)',
                fontWeight: 400, color: '#aaa', lineHeight: 1.5,
              }}>
                {hero?.subtext || 'Capturing timeless moments that tell stories of emotion, beauty, and truth in every frame.'}
              </p>
            </div>

            <div className="hidden md:block flex-1"
              style={{
                borderTop: '1px solid rgba(255,255,255,0.05)',
                borderLeft: '1px solid rgba(255,255,255,0.05)',
              }} />

            <div className="flex-1 flex items-center justify-center gap-2"
              style={{
                borderTop: '1px solid rgba(255,255,255,0.05)',
                borderLeft: '1px solid rgba(255,255,255,0.05)',
                padding: '20px 24px',
              }}>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1">
                  <span style={{
                    fontFamily: '"Geist Mono", monospace',
                    fontSize: 'clamp(36px, 5vw, 64px)',
                    fontWeight: 500, color: '#fff',
                  }}>{counter}</span>
                  <span style={{
                    fontFamily: '"Geist Mono", monospace',
                    fontSize: 'clamp(36px, 5vw, 64px)',
                    fontWeight: 500, color: '#ff4d00',
                  }}>+</span>
                </div>
                <span style={{
                  fontFamily: '"Geist", sans-serif',
                  fontSize: 'clamp(13px, 1.2vw, 16px)',
                  fontWeight: 400, color: '#aaa',
                }}>{awards?.label || 'Awards'}</span>
              </div>
            </div>

            <div className="hidden md:block flex-1"
              style={{
                borderTop: '1px solid rgba(255,255,255,0.05)',
                borderLeft: '1px solid rgba(255,255,255,0.05)',
              }} />
          </div>
        </div>

        <div style={{ height: '20px' }} />
      </div>
    </section>
  )
}