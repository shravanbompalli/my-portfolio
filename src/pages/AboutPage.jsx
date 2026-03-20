import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import AboutText from '../components/AboutText'
import Services from '../components/Services'
import Footer from '../components/Footer'

const spring = { type: 'spring', stiffness: 70, damping: 12, mass: 0.8 }

function NavLink({ to, label }) {
  const [h, setH] = useState(false)
  const s = {
    fontFamily: '"Geist",sans-serif', fontSize: '18px', fontWeight: 500,
    letterSpacing: '0.03em', textDecoration: 'underline',
    textDecorationOffset: '3px', textDecorationThickness: '2px',
    transition: 'transform 0.3s ease', display: 'block',
  }
  return (
    <Link to={to} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'block', position: 'relative', overflow: 'hidden', height: '24px', textDecoration: 'none' }}>
      <span style={{ ...s, color: '#000', transform: h ? 'translateY(-100%)' : 'translateY(0)' }}>{label}</span>
      <span style={{ ...s, color: '#ff4d00', position: 'absolute', left: 0, top: '100%', transform: h ? 'translateY(-100%)' : 'translateY(0)' }}>{label}</span>
    </Link>
  )
}

export default function AboutPage() {
  const [brand, setBrand] = useState(null)
  const [contact, setContact] = useState(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['brand', 'contact'])
      if (data) {
        data.forEach(r => {
          if (r.key === 'brand') setBrand(r.value)
          if (r.key === 'contact') setContact(r.value)
        })
      }
    }
    load()
    window.scrollTo(0, 0)
  }, [])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>

      {/* Grid lines */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, display: 'flex' }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ flex: 1, borderLeft: '1px solid rgba(0,0,0,0.04)', opacity: i === 3 ? 0 : 1 }} />
        ))}
      </div>

      {/* ── Navbar ── */}
      <div className="page-navbar" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        padding: '20px clamp(16px, 4vw, 40px)', borderBottom: '1px solid rgba(0,0,0,0.06)',
        position: 'relative', zIndex: 10,
      }}>
        <div className="nav-contact" style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '120px' }}>
          {contact && <>
            <a href={`mailto:${contact.email}`} style={{ fontFamily: '"Geist",sans-serif', fontSize: 'clamp(12px, 1.5vw, 14px)', color: '#404040', textDecoration: 'none' }}>{contact.email}</a>
            <span style={{ fontFamily: '"Geist",sans-serif', fontSize: '12px', color: '#aaa' }}>{contact.phone}</span>
          </>}
        </div>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: '"Geist",sans-serif', fontSize: 'clamp(16px, 2.5vw, 20px)', fontWeight: 600, color: '#000', letterSpacing: '0.05em' }}>
            ✦ {brand?.name || 'SHRAVAN'}
          </span>
        </Link>
        <div className="nav-info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', minWidth: '120px' }}>
          <span style={{ fontFamily: '"Geist",sans-serif', fontSize: 'clamp(12px, 1.5vw, 14px)', color: '#404040' }}>{brand?.title || 'Cinematographer'}</span>
          <span style={{ fontFamily: '"Geist",sans-serif', fontSize: '12px', color: '#aaa' }}>{brand?.location || 'Hyderabad, India'}</span>
        </div>
      </div>

      {/* ── Right side nav ── */}
      <nav className="page-right-nav" style={{
        position: 'fixed', right: '40px', top: '50%', transform: 'translateY(-50%)',
        zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '20px',
      }}>
        <NavLink to="/portfolio" label="PORTFOLIO" />
        <NavLink to="/about" label="ABOUT ME" />
        <NavLink to="/my-shots" label="MY SHOTS" />
        <NavLink to="/contact" label="CONTACT" />
      </nav>

      {/* ── Hero ── */}
      <section style={{
        padding: 'clamp(60px, 10vw, 140px) clamp(16px, 4vw, 40px) clamp(40px, 5vw, 60px)',
        maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 1,
      }}>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          className="hero-headline"
          style={{ display: 'flex', alignItems: 'center', gap: '0', flexWrap: 'wrap', marginBottom: '24px' }}
        >
          <h1 style={{
            fontFamily: '"Geist",sans-serif', fontSize: 'clamp(40px, 10vw, 130px)', fontWeight: 700,
            letterSpacing: '-0.04em', lineHeight: 1, color: '#000', margin: 0,
          }}>ABOUT</h1>
          <div className="headline-inline-image" style={{
            width: 'clamp(60px, 12vw, 160px)', height: 'clamp(45px, 8vw, 110px)',
            borderRadius: '8px', overflow: 'hidden', backgroundColor: '#ddd',
            margin: '0 8px', flexShrink: 0,
          }}>
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#d0c8c0,#b0a8a0)' }} />
          </div>
          <h1 style={{
            fontFamily: '"Geist",sans-serif', fontSize: 'clamp(40px, 10vw, 130px)', fontWeight: 700,
            letterSpacing: '-0.04em', lineHeight: 1, color: '#000', margin: 0,
          }}>ME</h1>
        </motion.div>

        {/* ── Mobile headline image (hidden on tablet+desktop) ── */}
        <motion.div
          className="headline-mobile-image"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ type: 'spring', stiffness: 60, damping: 14, mass: 0.8 }}
        >
          <div style={{
            width: '100%', height: '200px',
            borderRadius: '8px', overflow: 'hidden', backgroundColor: '#ddd',
          }}>
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#d0c8c0,#b0a8a0)' }} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.15 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '400px' }}
        >
          <p style={{
            fontFamily: '"Geist",sans-serif', fontSize: 'clamp(14px, 1.5vw, 18px)',
            color: '#404040', lineHeight: 1.6, margin: 0,
          }}>
            Get to know the person behind the lens. My journey, my passion, and what drives me to create timeless visuals.
          </p>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} style={{ display: 'inline-block', width: 'fit-content' }}>
            <Link to="/contact" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              fontFamily: '"Geist",sans-serif', fontSize: '15px', fontWeight: 500,
              color: '#fff', backgroundColor: '#000', padding: '14px 28px',
              borderRadius: '40px', textDecoration: 'none',
              transition: 'background-color 0.3s',
            }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#ff4d00'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#000'}>
              <span style={{ fontSize: '14px' }}>✦</span> Capture Your Story
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Sections ── */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <AboutText />
        <Services />
        <Footer />
      </div>

      <style>{`
        .headline-mobile-image { display: none; }
        @media (max-width: 809px) {
          .page-right-nav { display: none !important; }
          .nav-contact, .nav-info { display: none !important; }
          .hero-headline { justify-content: center !important; }
          .headline-inline-image { display: none !important; }
          .headline-mobile-image {
            display: block;
            margin-top: 20px;
            margin-bottom: 8px;
          }
        }
        @media (min-width: 810px) and (max-width: 1279px) {
          .page-right-nav { right: 20px !important; }
        }
      `}</style>
    </div>
  )
}