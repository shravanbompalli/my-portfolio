import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import MyShots from '../components/MyShots'
import Footer from '../components/Footer'

const spring = { type: 'spring', stiffness: 70, damping: 12, mass: 0.8 }

export default function MyShotsPage() {
  const [brand, setBrand] = useState(null)
  const [contact, setContact] = useState(null)
  const [myshots, setMyshots] = useState(null)
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 809px)').matches : false
  )

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 809px)')
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['brand', 'contact', 'myshots'])
      if (data) {
        data.forEach(r => {
          if (r.key === 'brand') setBrand(r.value)
          if (r.key === 'contact') setContact(r.value)
          if (r.key === 'myshots') setMyshots(r.value)
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
        padding: isMobile ? 'clamp(12px, 4vw, 20px) clamp(16px, 5vw, 40px)' : '20px 40px', borderBottom: '1px solid rgba(0,0,0,0.06)',
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

      {/* ── Hero: MY [IMAGE] SHOTS ── */}
      <section style={{
        padding: 'clamp(80px,10vw,140px) clamp(18px,4vw,40px) clamp(40px,5vw,60px)',
        maxWidth: '1400px', margin: '0 auto',
      }}>
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, display: 'flex' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ flex: 1, borderLeft: '1px solid rgba(0,0,0,0.04)', opacity: i === 3 ? 0 : 1 }} />
          ))}
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
            style={{ display: 'flex', alignItems: 'center', gap: '0', flexWrap: 'wrap', marginBottom: '24px' }}
          >
            <h1 style={{
              fontFamily: '"Geist",sans-serif', fontSize: 'clamp(48px,10vw,130px)', fontWeight: 700,
              letterSpacing: '-0.04em', lineHeight: 1, color: '#000', margin: 0,
            }}>MY</h1>
            <div className="headline-inline-image" style={{
              width: 'clamp(80px,14vw,180px)', height: 'clamp(60px,8vw,110px)',
              borderRadius: '8px', overflow: 'hidden', backgroundColor: '#ddd', margin: '0 8px',
            }}>
              {myshots?.myshots_image ? (
                <img src={myshots.myshots_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#b8c8d8,#90a0b0)' }} />
              )}
            </div>
            <h1 style={{
              fontFamily: '"Geist",sans-serif', fontSize: 'clamp(48px,10vw,130px)', fontWeight: 700,
              letterSpacing: '-0.04em', lineHeight: 1, color: '#000', margin: 0,
            }}>SHOTS</h1>
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
              {myshots?.myshots_image ? (
                <img src={myshots.myshots_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#b8c8d8,#90a0b0)' }} />
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
              Explore the shots that reflect my style, my eye, and the stories behind the lens.
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
        </div>
      </section>

      {/* ── All shots — no limit, different title ── */}
      <MyShots
        title="My Works"
        subtitle="Explore the shots that reflect my style, my eye, and the stories behind the lens."
      />

      <Footer />

      <style>{`
        .headline-mobile-image { display: none; }
        @media (max-width: 809px) {
          .page-right-nav { display: none !important; }
          .nav-contact { display: none !important; }
          .nav-info { display: none !important; }
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