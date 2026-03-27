import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'

/*
  TestimonialHighlight — uses framer-motion's whileInView
  
  whileInView is the simplest approach:
  - No useRef, no useInView hook, no external state
  - Each motion.* element watches itself
  - When it scrolls into view, it animates
  - viewport={{ once: true }} means it only animates once
  
  Spring config from Framer template:
  bounce: 0.2, duration: 0.4, type: "spring"
*/

// Bouncy spring — big overshoot, very visible
const spring = { type: 'spring', stiffness: 70, damping: 10, mass: 0.7 }
// Image rise — heavy, dramatic, slow glide up
const imgSpring = { type: 'spring', stiffness: 40, damping: 10, mass: 2 }

export default function TestimonialHighlight() {
  const [t, setT] = useState(null)
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 809px)').matches : false
  )
  const sectionRef = useRef()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'testimonial')
        .single()
      if (data) setT(data.value)
    }
    load()
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 809px)')
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])


  if (!t) return null

  return (
    <section
      ref={sectionRef}
      className="testimonial-section"
      style={{
        backgroundColor: '#f5f5f5',
        padding: '0 clamp(18px, 4vw, 40px)',
        overflow: 'visible',
      }}
    >
      <div
        className="testimonial-main-row"
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          gap: 'clamp(24px, 4vw, 48px)',
          alignItems: 'flex-end',
          position: 'relative',
          paddingTop: 'clamp(60px, 8vw, 120px)',
          paddingBottom: 'clamp(60px, 8vw, 100px)',
        }}
      >

        {/* ═══ LEFT COLUMN (~55%) ═══ */}
        <div
          style={{
            flex: '1 1 55%',
            minWidth: '280px',
            display: 'flex',
            flexDirection: 'column',
            gap: '32px',
            paddingBottom: '20px',
          }}
        >
          {/* Quote */}
          <motion.blockquote
            initial={isMobile ? { opacity: 0, y: 40 } : { opacity: 0, y: 80, scale: 0.96 }}
            whileInView={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: isMobile ? 0.3 : 0.1 }}
            transition={isMobile ? { type: 'spring', stiffness: 60, damping: 14, mass: 0.8 } : { ...spring, delay: 0 }}
            style={{
              fontFamily: '"Geist", sans-serif',
              fontSize: isMobile ? 'clamp(22px, 6vw, 36px)' : 'clamp(24px, 3.8vw, 48px)',
              fontWeight: 500,
              lineHeight: 1.3,
              letterSpacing: '-0.02em',
              textAlign: 'left',
              color: '#000',
              margin: 0, padding: 0, border: 'none',
            }}
          >
            {'\u201C'}{t.quote}{'\u201D'}
          </motion.blockquote>

          {/* Reviewer */}
          <motion.div
            initial={{ opacity: 0, y: 60, x: -30 }}
            whileInView={{ opacity: 1, y: 0, x: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ ...spring, delay: 0.2 }}
            style={{ display: 'flex', alignItems: 'center', gap: '14px' }}
          >
            <div
              style={{
                width: '48px', height: '48px', borderRadius: '50%',
                overflow: 'hidden', flexShrink: 0, backgroundColor: '#ddd',
                border: '1px solid rgba(128,128,128,0.3)',
              }}
            >
              {t.reviewer_image ? (
                <img src={t.reviewer_image} alt={t.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{
                  width: '100%', height: '100%',
                  background: 'linear-gradient(135deg, #c8c8c8, #a0a0a0)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: '"Geist",sans-serif', fontSize: '18px', fontWeight: 600, color: '#fff',
                }}>
                  {t.name?.charAt(0) || 'S'}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontFamily: '"Geist", sans-serif', fontSize: '16px', fontWeight: 500, color: '#000' }}>
                {t.name}
              </span>
              <span style={{ fontFamily: '"Geist", sans-serif', fontSize: '14px', fontWeight: 400, color: '#606060' }}>
                {t.role}
              </span>
            </div>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ ...spring, delay: 0.35 }}
          >
            <Link
              to="/contact"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                backgroundColor: '#000', color: '#fff',
                fontFamily: '"Geist", sans-serif', fontSize: '15px', fontWeight: 500,
                padding: '14px 28px', borderRadius: '100px', textDecoration: 'none',
                transition: 'background-color 0.3s ease, transform 0.3s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#ff4d00'; e.currentTarget.style.transform = 'scale(1.04)' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#000'; e.currentTarget.style.transform = 'scale(1)' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0L9.8 6.2L16 8L9.8 9.8L8 16L6.2 9.8L0 8L6.2 6.2L8 0Z" />
              </svg>
              Capture Your Story
            </Link>
          </motion.div>
        </div>

        {/* ═══ RIGHT COLUMN (~45%) — Two images SIDE BY SIDE ═══ */}
        <div
          className="testimonial-images"
          style={{
            flex: '0 0 45%',
            display: 'flex',
            flexDirection: 'row',
            gap: '16px',
            alignItems: 'flex-end',
          }}
        >
          {/* Image 2 — landscape, LEFT — fades in after Image 1 */}
          <motion.div
            initial={isMobile ? { opacity: 0, scale: 0.95 } : { opacity: 0, y: 60, rotate: -2 }}
            whileInView={isMobile ? { opacity: 1, scale: 1 } : { opacity: 1, y: 0, rotate: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={isMobile ? { type: 'spring', stiffness: 60, damping: 14, mass: 0.8, delay: 0.25 } : { ...imgSpring, delay: 0.4 }}
            style={{
              flex: '1 1 45%', aspectRatio: '3 / 4', borderRadius: '12px',
              overflow: 'hidden', backgroundColor: '#e0dcd8', alignSelf: 'flex-end',
            }}
          >
            {t.image_2 ? (
              <img src={t.image_2} alt="Portrait"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'saturate(1.4)' }} />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                background: 'linear-gradient(135deg, #e0d8d0, #c8c0b8)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
                <span style={{ fontFamily: '"Geist",sans-serif', fontSize: '12px', color: '#bbb' }}>Image 2</span>
              </div>
            )}
          </motion.div>

          {/* Image 1 — tall portrait, RIGHT, overlaps hero — ANIMATED: rises up slowly */}
          <div style={{ flex: '1 1 55%' }}>
          <motion.div
            initial={isMobile ? { opacity: 0, scale: 0.95 } : { opacity: 0, y: 200, rotate: 3, scale: 0.9 }}
            whileInView={isMobile ? { opacity: 1, scale: 1 } : { opacity: 1, y: 0, rotate: 0, scale: 1 }}
            viewport={{ once: true, amount: isMobile ? 0.2 : 0.05 }}
            transition={isMobile ? { type: 'spring', stiffness: 60, damping: 14, mass: 0.8, delay: 0.1 } : { ...imgSpring, delay: 0 }}
            style={{
              width: '100%', aspectRatio: '3 / 4.5', borderRadius: '12px',
              overflow: 'hidden', backgroundColor: '#e8e4e0',
              marginTop: isMobile ? 0 : 'clamp(-120px, -12vw, -60px)',
            }}
          >
            {t.image_1 ? (
              <img src={t.image_1} alt="Portrait"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'saturate(1.4)' }} />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                background: 'linear-gradient(135deg, #d8e0e0, #c0c8c8)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
                <span style={{ fontFamily: '"Geist",sans-serif', fontSize: '12px', color: '#bbb' }}>Portrait 1</span>
              </div>
            )}
          </motion.div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 809px) {
          .testimonial-section { overflow: hidden !important; }
          .testimonial-main-row { flex-direction: column !important; align-items: stretch !important; }
          .testimonial-images {
            flex: 1 1 100% !important;
            margin-top: 20px !important;
            align-items: flex-start !important;
          }
        }
        @media (min-width: 810px) and (max-width: 1279px) {
          .testimonial-images { flex: 0 0 40% !important; }
        }
      `}</style>
    </section>
  )
}