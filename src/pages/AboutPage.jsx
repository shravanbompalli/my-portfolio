import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import AboutText from '../components/AboutText'
import Footer from '../components/Footer'
import BlurText from '../components/reactbits/BlurText'
import FadeReveal from '../components/reactbits/FadeReveal'

function ToolsSection({ tools }) {
  if (!tools || tools.length === 0) return null
  return (
    <section style={{
      backgroundColor: '#f5f5f5',
      padding: 'clamp(60px, 8vw, 100px) clamp(18px, 4vw, 40px)',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ type: 'spring', stiffness: 60, damping: 14 }}
          style={{
            fontFamily: '"Geist", sans-serif', fontSize: '12px',
            letterSpacing: '0.15em', textTransform: 'uppercase',
            color: '#aaa', margin: '0 0 32px',
          }}
        >
          Tools &amp; Gear
        </motion.p>
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

      {/* ── Hero: portrait photo left, text right ── */}
      <section className="about-hero" style={{
        height: '100dvh', backgroundColor: '#f5f5f5',
        display: 'flex', alignItems: 'stretch',
        padding: 'clamp(16px, 3vw, 40px)',
        gap: 'clamp(24px, 4vw, 60px)',
      }}>
        {/* Portrait photo — natural 9:16, full height */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 50, damping: 14, delay: 0.1 }}
          className="about-hero-photo"
          style={{
            flexShrink: 0,
            width: 'auto',
            height: '100%',
            borderRadius: '16px',
            overflow: 'hidden',
            aspectRatio: '9 / 16',
          }}
        >
          {about?.about_image ? (
            <img
              src={about.about_image}
              alt=""
              style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover', objectPosition: 'top' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #ddd, #ccc)' }} />
          )}
        </motion.div>

        {/* Text side */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          paddingBottom: 'clamp(16px, 3vw, 40px)',
        }}>
          {/* ABOUT ME headline */}
          <div className="about-headline-wrap" style={{
            fontSize: 'clamp(40px, 7vw, 120px)', fontWeight: 700,
            letterSpacing: '-0.04em', color: '#000', lineHeight: 1, marginBottom: '20px',
          }}>
            <BlurText text="ABOUT ME" delay={100} animateBy="words" direction="bottom" />
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 60, damping: 14, delay: 0.5 }}
            style={{
              fontFamily: '"Geist", sans-serif',
              fontSize: 'clamp(15px, 1.6vw, 22px)',
              color: '#606060',
              margin: '0 0 32px', lineHeight: 1.6, maxWidth: '480px',
            }}
          >
            The person behind the lens.
          </motion.p>

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
            font-size: clamp(28px, 9vw, 56px) !important;
          }
          .about-hero {
            flex-direction: column !important;
            height: auto !important;
            min-height: 100dvh !important;
          }
          .about-hero-photo {
            width: 100% !important;
            height: 60vw !important;
            aspect-ratio: unset !important;
            flex-shrink: 0 !important;
          }
        }
      `}</style>
    </div>
  )
}