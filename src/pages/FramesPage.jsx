import { useState, useEffect, useRef } from 'react'
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
  const heroVideoRef = useRef(null)

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

  useEffect(() => {
    if (heroVideoRef.current) {
      heroVideoRef.current.play().catch(() => {})
    }
  }, [frames])

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
        {frames?.hero_video ? (
          <video
            ref={heroVideoRef}
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
