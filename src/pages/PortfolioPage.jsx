import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import Portfolio from '../components/Portfolio'
import Footer from '../components/Footer'

const spring = { type: 'spring', stiffness: 70, damping: 12, mass: 0.8 }

export default function PortfolioPage() {
  const [brand, setBrand] = useState(null)
  const [contact, setContact] = useState(null)
  const [portfolio, setPortfolio] = useState(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['brand', 'contact', 'portfolio'])
      if (data) {
        data.forEach(r => {
          if (r.key === 'brand') setBrand(r.value)
          if (r.key === 'contact') setContact(r.value)
          if (r.key === 'portfolio') setPortfolio(r.value)
        })
      }
    }
    load()
    window.scrollTo(0, 0)
  }, [])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>

      {/* ── Navbar ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        padding: 'clamp(12px, 4vw, 20px) clamp(16px, 5vw, 40px)', borderBottom: '1px solid rgba(0,0,0,0.06)',
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

      {/* ── Hero Header ── */}
      <section style={{
        padding: 'clamp(80px,10vw,140px) clamp(18px,4vw,40px) clamp(20px,3vw,40px)',
        maxWidth: '1400px', margin: '0 auto',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0', flexWrap: 'nowrap', marginBottom: '24px' }}>
            <h1 style={{
              fontFamily: '"Geist",sans-serif', fontSize: 'clamp(48px,10vw,130px)', fontWeight: 700,
              letterSpacing: '-0.04em', lineHeight: 1, color: '#000', margin: 0,
            }}>
              PORT
            </h1>
            <div className="portfolio-inline-image" style={{
              width: 'clamp(80px,12vw,160px)', height: 'clamp(60px,8vw,100px)',
              borderRadius: '8px', overflow: 'hidden', backgroundColor: '#ddd',
              margin: '0 4px',
            }}>
              {portfolio?.portfolio_image ? (
                <img src={portfolio.portfolio_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#c8d8d8,#a0b0b0)' }} />
              )}
            </div>
            <h1 style={{
              fontFamily: '"Geist",sans-serif', fontSize: 'clamp(48px,10vw,130px)', fontWeight: 700,
              letterSpacing: '-0.04em', lineHeight: 1, color: '#000', margin: 0,
            }}>
              FOLIO
            </h1>
          </div>

          {/* Mobile-only full-width image — shown below headline on phone */}
          <div className="portfolio-mobile-image" style={{
            width: '100%', height: '200px', borderRadius: '8px',
            overflow: 'hidden', backgroundColor: '#ddd', marginBottom: '8px',
          }}>
            {portfolio?.portfolio_image ? (
              <img src={portfolio.portfolio_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#c8d8d8,#a0b0b0)' }} />
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.15 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '400px' }}
        >
          <p style={{
            fontFamily: '"Geist",sans-serif', fontSize: 'clamp(14px,1.5vw,18px)',
            color: '#404040', lineHeight: 1.6, margin: 0,
          }}>
            Browse through a collection of my favorite shots and moments captured while exploring the beauty of cinematography.
          </p>
          <Link to="/contact" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            fontFamily: '"Geist",sans-serif', fontSize: '15px', fontWeight: 500,
            color: '#fff', backgroundColor: '#000', padding: '14px 28px',
            borderRadius: '40px', textDecoration: 'none', width: 'fit-content',
            transition: 'background-color 0.3s',
          }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#ff4d00'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#000'}>
            <span style={{ fontSize: '14px' }}>✦</span> Capture Your Story
          </Link>
        </motion.div>
      </section>

      {/* ── All Projects Grid (no limit) ── */}
      <Portfolio />

      <Footer />

      <style>{`
        .portfolio-mobile-image { display: none; }
        @media (max-width: 809px) {
          .nav-contact, .nav-info { display: none !important; }
          .portfolio-inline-image { display: none !important; }
          .portfolio-mobile-image { display: block !important; }
        }
      `}</style>
    </div>
  )
}