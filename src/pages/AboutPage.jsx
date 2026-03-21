import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import AboutText from '../components/AboutText'
import Footer from '../components/Footer'
import BlurText from '../components/reactbits/BlurText'
import FadeReveal from '../components/reactbits/FadeReveal'

const spring = { type: 'spring', stiffness: 70, damping: 12, mass: 0.8 }

function ToolsSection({ tools }) {
  if (!tools || tools.length === 0) return null
  return (
    <section style={{
      backgroundColor: '#f5f5f5',
      padding: 'clamp(60px, 8vw, 100px) clamp(18px, 4vw, 40px)',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <p style={{
          fontFamily: '"Geist", sans-serif', fontSize: '12px',
          letterSpacing: '0.15em', textTransform: 'uppercase',
          color: '#aaa', margin: '0 0 32px',
        }}>
          Tools &amp; Gear
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {tools.map((tool, i) => (
            <FadeReveal key={tool} delay={i * 0.05}>
              <span style={{
                fontFamily: '"Geist", sans-serif', fontSize: '15px', color: '#000',
                padding: '10px 20px', borderRadius: '40px',
                border: '1px solid rgba(0,0,0,0.12)', backgroundColor: '#fff',
                display: 'inline-block',
              }}>
                {tool}
              </span>
            </FadeReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function AboutPage() {
  const [brand, setBrand] = useState(null)
  const [contact, setContact] = useState(null)
  const [about, setAbout] = useState(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['brand', 'contact', 'about'])
      if (data) {
        data.forEach(r => {
          if (r.key === 'brand') setBrand(r.value)
          if (r.key === 'contact') setContact(r.value)
          if (r.key === 'about') setAbout(r.value)
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

      {/* ── Hero: full-bleed image ── */}
      <section style={{ position: 'relative', height: '100vh', overflow: 'hidden', backgroundColor: '#000' }}>
        {/* Background image */}
        <motion.div
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 60, damping: 14 }}
          style={{ position: 'absolute', inset: 0 }}
        >
          {about?.about_image ? (
            <img
              src={about.about_image}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a1a1a, #000)' }} />
          )}
        </motion.div>

        {/* Dark overlay */}
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 1 }} />

        {/* Content */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          padding: 'clamp(24px, 6vw, 80px)',
        }}>
          {/* ABOUT ME headline via BlurText */}
          <div className="about-headline-wrap" style={{
            fontSize: 'clamp(48px, 11vw, 148px)', fontWeight: 700,
            letterSpacing: '-0.04em', color: '#fff', lineHeight: 1, marginBottom: '16px',
          }}>
            <BlurText text="ABOUT ME" delay={100} animateBy="words" direction="bottom" />
          </div>

          {/* Tagline — uses animate (not whileInView) since it's above the fold */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 60, damping: 14, delay: 0.5 }}
            style={{
              fontFamily: '"Geist", sans-serif',
              fontSize: 'clamp(16px, 2vw, 22px)',
              color: 'rgba(255,255,255,0.7)',
              margin: '0 0 28px', lineHeight: 1.5,
            }}
          >
            The person behind the lens.
          </motion.p>

          {/* CTA — uses animate (not whileInView) since it's above the fold */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 60, damping: 14, delay: 0.7 }}
            style={{ display: 'inline-block' }}
          >
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} style={{ display: 'inline-block' }}>
              <Link to="/contact" style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                fontFamily: '"Geist", sans-serif', fontSize: '15px', fontWeight: 500,
                color: '#fff', backgroundColor: '#000', padding: '14px 28px',
                borderRadius: '40px', textDecoration: 'none',
                transition: 'background-color 0.3s',
              }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#ff4d00'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#000'}
              >
                <span style={{ fontSize: '14px' }}>✦</span> Capture Your Story
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Sections ── */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <AboutText />
        <ToolsSection tools={about?.tools} />
        <Footer />
      </div>

      <style>{`
        .about-headline-wrap p {
          font-size: inherit !important;
          font-weight: inherit !important;
          letter-spacing: inherit !important;
          line-height: inherit !important;
          color: inherit !important;
          font-family: "Geist", sans-serif !important;
        }
        @media (max-width: 809px) {
          .nav-contact, .nav-info { display: none !important; }
          .about-headline-wrap {
            font-size: clamp(32px, 10vw, 64px) !important;
          }
        }
      `}</style>
    </div>
  )
}