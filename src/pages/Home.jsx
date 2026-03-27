import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import TestimonialHighlight from '../components/TestimonialHighlight'
import AboutText from '../components/AboutText'
import Services from '../components/Services'
import Portfolio from '../components/Portfolio'
import MyShots from '../components/MyShots'
import Footer from '../components/Footer'
import GradientText from '../components/reactbits/GradientText'

/* ── Shared NavLink (slide-up orange hover) ── */
function NavLink({ to, label, dark }) {
  const [h, setH] = useState(false)
  const c1 = dark ? '#000' : '#fff'
  const s = {
    fontFamily: '"Geist",sans-serif', fontSize: '18px', fontWeight: 500,
    letterSpacing: '0.03em', textDecoration: 'underline',
    textDecorationOffset: '3px', textDecorationThickness: '2px',
    transition: 'transform 0.3s ease', display: 'block',
  }
  return (
    <Link to={to} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'block', position: 'relative', overflow: 'hidden', height: '24px', textDecoration: 'none' }}>
      <span style={{ ...s, color: c1, transform: h ? 'translateY(-100%)' : 'translateY(0)' }}>{label}</span>
      <span style={{ ...s, color: '#ff4d00', position: 'absolute', left: 0, top: '100%', transform: h ? 'translateY(-100%)' : 'translateY(0)' }}>{label}</span>
    </Link>
  )
}

function Arrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ transform: 'rotate(45deg)' }}>
      <path d="M12 19V5" /><path d="M5 12l7-7 7 7" />
    </svg>
  )
}

export default function Home() {
  const [hero, setHero] = useState(null)
  const [brand, setBrand] = useState(null)
  const [contact, setContact] = useState(null)
  const [social, setSocial] = useState(null)
  const [awards, setAwards] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const dataLoaded = useRef(false)
  const heroRef = useRef()
  const bgRef = useRef()
  const contentRef = useRef()
  const rafRef = useRef()

  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 809px)').matches : false
  )
  const isMobileRef = useRef(
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 809px)').matches : false
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 809px)')
    const handler = (e) => { setIsMobile(e.matches); isMobileRef.current = e.matches }
    mq.addEventListener('change', handler)
    isMobileRef.current = mq.matches
    setIsMobile(mq.matches)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (dataLoaded.current) return
    dataLoaded.current = true
    async function load() {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['hero', 'brand', 'contact', 'social', 'awards'])
      if (data) {
        data.forEach(r => {
          if (r.key === 'hero') setHero(r.value)
          if (r.key === 'brand') setBrand(r.value)
          if (r.key === 'contact') setContact(r.value)
          if (r.key === 'social') setSocial(r.value)
          if (r.key === 'awards') setAwards(r.value)
        })
      }
      setTimeout(() => setLoaded(true), 100)
    }
    load()
  }, [])

  // Scroll parallax — direct rAF, 60fps, no CSS transitions, no drift
  // Disabled on mobile to prevent interference with page exit animations
  useEffect(() => {
    function onScroll() {
      if (isMobileRef.current) return
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        if (!heroRef.current) return
        const rect = heroRef.current.getBoundingClientRect()
        if (rect.bottom <= 0) return
        const s = window.scrollY
        if (contentRef.current) {
          contentRef.current.style.transform = `translateY(${s * -0.15}px)`
        }
        if (bgRef.current) {
          bgRef.current.style.transform = `scale(1.1) translateY(${s * 0.3}px)`
        }
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Resolved text color for all hero elements
  const tc = hero?.text_color === 'orange' ? '#ff4d00'
           : hero?.text_color === 'gold'   ? '#d4a843'
           : '#fff'
  const isGradient = hero?.text_color === 'gradient'
  const isWhite    = !hero?.text_color || hero?.text_color === 'white'

  return (
    <div>
      {/* ══════════════ SECTION 1: HERO ══════════════ */}
      <section ref={heroRef} style={{
        position: 'relative', width: '100%', height: '100vh',
        overflow: 'hidden', backgroundColor: '#000',
      }}>
        <figure ref={bgRef} style={{
          position: 'absolute', inset: 0, margin: 0,
          transform: loaded ? 'scale(1.1)' : 'scale(1.5)',
          transition: 'none',
          willChange: 'transform',
        }}>
          {hero?.hero_mode === 'video' && hero?.hero_video ? (
            <video
              key={hero.hero_video}
              src={hero.hero_video}
              autoPlay
              loop
              muted
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : hero?.bg_image ? (
            <img src={hero.bg_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'radial-gradient(ellipse at center,#1a1a1a,#000)' }} />
          )}
        </figure>

        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, display: 'flex' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ flex: 1, borderLeft: '1px solid rgba(255,255,255,0.05)', opacity: i === 3 ? 0 : 1 }} />
          ))}
        </div>

        <div ref={contentRef} style={{ position: 'absolute', inset: 0, zIndex: 2, display: 'flex', flexDirection: 'column', willChange: 'transform' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            padding: isMobile ? 'clamp(12px, 4vw, 20px) clamp(16px, 5vw, 40px)' : '20px 40px',
            background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 14.57%, transparent 100%)',
          }}>
            <div className="hero-nav-contact" style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '180px' }}>
              {contact && <>
                <a href={`mailto:${contact.email}`} style={{ fontFamily: '"Geist",sans-serif', fontSize: '14px', color: '#ddd', textDecoration: 'none' }}>{contact.email}</a>
                <span style={{ fontFamily: '"Geist",sans-serif', fontSize: '12px', color: '#888' }}>{contact.phone}</span>
              </>}
            </div>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <span style={{ fontFamily: '"Geist",sans-serif', fontSize: '20px', fontWeight: 600, color: '#fff', letterSpacing: '0.05em' }}>
                ✦ {brand?.name || 'SHRAVAN'}
              </span>
            </Link>
            <div className="hero-nav-info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', minWidth: '180px' }}>
              <span style={{ fontFamily: '"Geist",sans-serif', fontSize: '14px', color: '#ddd' }}>{brand?.title || 'Cinematographer'}</span>
              <span style={{ fontFamily: '"Geist",sans-serif', fontSize: '12px', color: '#888' }}>{brand?.location || 'Hyderabad, India'}</span>
            </div>
          </div>

          <div style={{ flex: 1, display: isMobile ? 'none' : 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px' }}>
            <div style={{
              opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.6s ease 0.7s',
            }}>
              <Link to="/my-shots" style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{
                  width: '172px', height: '172px', borderRadius: '12px', overflow: 'hidden',
                  position: 'relative', backgroundColor: '#222', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}>
                  {hero?.recent_work_image ? (
                    <img src={hero.recent_work_image} alt="Recent Work" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#2a2a3a,#1a1a2a)' }} />
                  )}
                  <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} />
                </div>
                <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '13px', color: '#ddd', marginTop: '8px' }}>Recent Work</p>
              </Link>
            </div>

            <nav style={{
              display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '20px',
              opacity: loaded ? 1 : 0, transform: loaded ? 'translateX(0)' : 'translateX(20px)',
              transition: 'all 0.6s ease 0.6s',
            }}>
              <NavLink to="/portfolio" label="PORTFOLIO" />
              <NavLink to="/about" label="ABOUT ME" />
              <NavLink to="/my-shots" label="MY SHOTS" />
              <NavLink to="/contact" label="CONTACT" />
            </nav>
          </div>

          <div style={{ padding: isMobile ? '0 clamp(16px, 5vw, 40px)' : '0 40px' }}>
            {hero?.show_tagline !== false && (
              <div style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(40px)', transition: 'all 0.8s ease 0.6s', marginBottom: '8px' }}>
                <p style={{ fontFamily: '"Geist",sans-serif', fontSize: 'clamp(18px,2.5vw,28px)', fontWeight: 500, color: isGradient ? '#eee' : tc, letterSpacing: '-0.01em', margin: 0, opacity: 0.85 }}>
                  {hero?.tagline || 'Award-winning creative'}
                </p>
              </div>
            )}
            <div style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(60px)', transition: 'all 0.8s ease 0.4s' }}>
              {isGradient ? (
                <GradientText colors={['#ffffff', '#ff4d00', '#ffffff']} animationSpeed={6}>
                  <h1 style={{ fontFamily: '"Geist",sans-serif', fontSize: isMobile ? 'clamp(22px, 10vw, 48px)' : 'clamp(48px,11vw,148px)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: '100%', margin: 0 }}>
                    {hero?.headline || 'CINEMATOGRAPHER'}
                  </h1>
                </GradientText>
              ) : (
                <h1 style={{
                  fontFamily: '"Geist",sans-serif', fontSize: isMobile ? 'clamp(22px, 10vw, 48px)' : 'clamp(48px,11vw,148px)', fontWeight: 700,
                  letterSpacing: '-0.04em', lineHeight: '100%', margin: 0,
                  color: tc, mixBlendMode: isWhite ? 'difference' : 'normal',
                }}>
                  {hero?.headline || 'CINEMATOGRAPHER'}
                </h1>
              )}
            </div>
          </div>

          {hero?.show_bottom_bar !== false && (
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'stretch', opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(-40px)', transition: 'all 0.6s ease 0.8s' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', padding: isMobile ? '12px 16px' : '16px 40px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {social?.instagram && (
                  <a href={social.instagram} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: tc, textDecoration: 'none', fontFamily: '"Geist",sans-serif', fontSize: '15px' }}><Arrow /> Instagram</a>
                )}
                {social?.youtube && (
                  <a href={social.youtube} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: tc, textDecoration: 'none', fontFamily: '"Geist",sans-serif', fontSize: '15px' }}><Arrow /> YouTube</a>
                )}
              </div>
              <div style={{ flex: 1, padding: isMobile ? '12px 16px' : '16px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', borderLeft: isMobile ? 'none' : '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center' }}>
                <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '14px', color: '#aaa', lineHeight: 1.5, maxWidth: '280px', margin: 0 }}>
                  {hero?.subtext || 'Capturing timeless moments that tell stories of emotion, beauty, and truth in every frame and every pose.'}
                </p>
              </div>
              {hero?.show_award !== false && (
                <div style={{ flex: 1, padding: isMobile ? '12px 16px' : '16px 40px', borderTop: '1px solid rgba(255,255,255,0.05)', borderLeft: isMobile ? 'none' : '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'flex-start' : 'flex-end', gap: '8px' }}>
                  <span style={{ fontSize: '24px' }}>🏆</span>
                  <div>
                    <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '15px', fontWeight: 500, color: tc, margin: 0 }}>{awards?.name || 'Hasselblad Award'}</p>
                    <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '13px', color: tc, margin: 0, opacity: 0.6 }}>{awards?.years || '2025, 2023'}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          <div style={{ height: '16px' }} />
        </div>
      </section>

      {/* ══════════════ SECTION 2: TESTIMONIAL ══════════════ */}
      <TestimonialHighlight />

      {/* ══════════════ SECTION 3: ABOUT TEXT ══════════════ */}
      <AboutText />

      {/* ══════════════ SECTION 4: SERVICES ══════════════ */}
      <Services />

      {/* ══════════════ SECTION 5: PORTFOLIO (homepage picks) ══════════════ */}
      <Portfolio homepageOnly />

      {/* ══════════════ SECTION 6: MY SHOTS (preview — 6 photos) ══════════════ */}
      <MyShots
        limit={6}
        title="See Through My Lens"
        subtitle="Browse through a collection of my favorite shots & some moments captured while exploring the beauty of nature."
      />

      {/* ══════════════ SECTION 7: FOOTER CTA ══════════════ */}
      <Footer />

      <style>{`
        @media (max-width: 1279px) {
          .hero-nav-contact { display: none !important; }
          .hero-nav-info { display: none !important; }
        }
      `}</style>
    </div>
  )
}