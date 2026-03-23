import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'

/*
  Framer Footer — two sections:
  1. CTA: Dark bg + "Let's Create Something Extraordinary" + Book a Session
  2. Footer: Email+quote (left) | Nav columns (right) | Copyright (bottom)
*/

const spring = { type: 'spring', stiffness: 70, damping: 12, mass: 0.8 }

function FooterNavLink({ href, label, to, target, rel }) {
  const [h, setH] = useState(false)
  const s = {
    fontFamily: '"Geist",sans-serif', fontSize: '16px', fontWeight: 500,
    letterSpacing: '0.02em', textDecoration: 'underline',
    textDecorationOffset: '3px', textDecorationThickness: '1.5px',
    transition: 'transform 0.3s ease', display: 'block',
  }
  const Tag = to ? Link : 'a'
  const props = to ? { to } : { href, target, rel }

  return (
    <Tag {...props}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'block', position: 'relative', overflow: 'hidden', height: '22px', textDecoration: 'none' }}>
      <span style={{ ...s, color: '#fff', transform: h ? 'translateY(-100%)' : 'translateY(0)' }}>{label}</span>
      <span style={{ ...s, color: '#ff4d00', position: 'absolute', left: 0, top: '100%', transform: h ? 'translateY(-100%)' : 'translateY(0)' }}>{label}</span>
    </Tag>
  )
}

export default function Footer() {
  const [contact, setContact] = useState(null)
  const [social, setSocial] = useState(null)
  const [brand, setBrand] = useState(null)
  const [stats, setStats] = useState(null)
  const [footer, setFooter] = useState(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['contact', 'social', 'brand', 'stats', 'footer'])
      if (data) {
        data.forEach(r => {
          if (r.key === 'contact') setContact(r.value)
          if (r.key === 'social') setSocial(r.value)
          if (r.key === 'brand') setBrand(r.value)
          if (r.key === 'stats') setStats(r.value)
          if (r.key === 'footer') setFooter(r.value)
        })
      }
    }
    load()
  }, [])

  return (
    <>
      {/* ══════════ CTA SECTION — Dark with BG image ══════════ */}
      <section style={{ position: 'relative', overflow: 'hidden', backgroundColor: '#000' }}>

        {/* BG Image + gradient mask */}
        <div style={{ position: 'absolute', inset: 0 }}>
          {footer?.bg_image ? (
            <img src={footer.bg_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'radial-gradient(ellipse at 50% 30%, #1a1a1a 0%, #000 70%)' }} />
          )}
          <div style={{
            position: 'absolute', inset: 0, backgroundColor: '#000',
            mask: 'linear-gradient(0deg, rgba(0,0,0,1) 50%, rgba(0,0,0,0.4) 100%)',
            WebkitMask: 'linear-gradient(0deg, rgba(0,0,0,1) 50%, rgba(0,0,0,0.4) 100%)',
          }} />
        </div>

        {/* Grid lines */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, display: 'flex' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ flex: 1, borderLeft: '1px solid rgba(255,255,255,0.05)', opacity: i === 3 ? 0 : 1 }} />
          ))}
        </div>

        {/* CTA Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ type: 'spring', stiffness: 60, damping: 14, mass: 0.8 }}
          style={{
            position: 'relative', zIndex: 2,
            maxWidth: '1400px', margin: '0 auto',
            padding: 'clamp(100px, 14vw, 200px) clamp(18px, 4vw, 40px) clamp(80px, 10vw, 140px)',
          }}>
          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.1 }}
            transition={spring}
            style={{ marginBottom: 'clamp(24px, 3vw, 40px)' }}
          >
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
              <h2 style={{
                fontFamily: '"Geist", sans-serif',
                fontSize: 'clamp(32px, 5vw, 60px)',
                fontWeight: 500, color: '#fff',
                lineHeight: 1.1, letterSpacing: '-0.02em',
                margin: 0, maxWidth: '700px',
              }}>
                Let's Create Something Extraordinary
              </h2>
            </div>
          </motion.div>

          {/* Book a Session button */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: false }}
            transition={{ ...spring, delay: 0.15 }}
          >
            <motion.div
              whileHover={{ scale: 1.06, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              style={{ display: 'inline-block' }}
            >
              <Link to="/contact" style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                fontFamily: '"Geist", sans-serif', fontSize: '16px', fontWeight: 500,
                color: '#000', backgroundColor: '#ff4d00',
                padding: '16px 36px', borderRadius: '40px', textDecoration: 'none',
                transition: 'background-color 0.3s, box-shadow 0.3s',
                boxShadow: '0 4px 20px rgba(255,77,0,0.2)',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = '#ff6a2a'
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(255,77,0,0.4)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = '#ff4d00'
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,77,0,0.2)'
                }}
              >
                Book a Session
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════ ACTUAL FOOTER ══════════ */}
      <footer style={{ backgroundColor: '#000' }}>
        <div style={{
          maxWidth: '1400px', margin: '0 auto',
          padding: 'clamp(48px, 6vw, 80px) clamp(18px, 4vw, 40px) clamp(32px, 4vw, 48px)',
        }}>
          {/* Main footer grid — Email+Quote left, Nav+Stats right */}
          <div className="footer-grid" style={{
            display: 'flex', justifyContent: 'space-between', gap: 'clamp(40px, 6vw, 80px)',
            marginBottom: 'clamp(48px, 6vw, 80px)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: 'clamp(40px, 5vw, 64px)',
          }}>
            {/* LEFT — Email + Quote */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false }}
              transition={{ ...spring, delay: 0.1 }}
              style={{ flex: '1 1 40%', display: 'flex', flexDirection: 'column', gap: '32px' }}
            >
              {/* Email */}
              <div>
                <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '13px', color: '#606060', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Get in touch
                </p>
                <a href={`mailto:${contact?.email || ''}`} style={{
                  fontFamily: '"Geist",sans-serif', fontSize: 'clamp(18px, 2.5vw, 28px)',
                  fontWeight: 500, color: '#fff', textDecoration: 'none',
                  transition: 'color 0.3s',
                }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ff4d00'}
                  onMouseLeave={e => e.currentTarget.style.color = '#fff'}
                >
                  {contact?.email || 'hello@shravan.com'}
                </a>
              </div>

              {/* Quote */}
              <p style={{
                fontFamily: '"Geist",sans-serif', fontSize: 'clamp(14px, 1.3vw, 16px)',
                fontWeight: 400, color: '#606060', lineHeight: 1.6,
                margin: 0, maxWidth: '360px', fontStyle: 'italic',
              }}>
                "Every frame is a chance to tell a story that words can't capture."
              </p>
            </motion.div>

            {/* RIGHT — Nav columns + Stats */}
            <motion.div
              className="footer-nav-columns"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ type: 'spring', stiffness: 60, damping: 14, mass: 0.8, delay: 0.1 }}
              style={{
                flex: '1 1 55%',
                display: 'flex', gap: 'clamp(40px, 5vw, 80px)',
                justifyContent: 'flex-end',
              }}
            >
              {/* Pages column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '13px', color: '#606060', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Pages
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <FooterNavLink to="/" label="Home" />
                  <FooterNavLink to="/portfolio" label="Portfolio" />
                  <FooterNavLink to="/about" label="About" />
                  <FooterNavLink to="/my-shots" label="My Shots" />
                  <FooterNavLink to="/contact" label="Contact" />
                </div>
              </div>

              {/* Socials column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '13px', color: '#606060', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Socials
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {social?.instagram && <FooterNavLink href={social.instagram} label="Instagram" target="_blank" rel="noopener" />}
                  {social?.youtube && <FooterNavLink href={social.youtube} label="YouTube" target="_blank" rel="noopener" />}
                </div>
              </div>

              {/* Stats column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <p style={{ fontFamily: '"Geist Mono",monospace', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 500, color: '#fff', margin: 0 }}>
                    {stats?.projects || '50'}<span style={{ color: '#ff4d00' }}>+</span>
                  </p>
                  <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '13px', color: '#606060', margin: '4px 0 0' }}>Projects</p>
                </div>
                <div>
                  <p style={{ fontFamily: '"Geist Mono",monospace', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 500, color: '#fff', margin: 0 }}>
                    {stats?.satisfaction || '98'}<span style={{ color: '#ff4d00' }}>%</span>
                  </p>
                  <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '13px', color: '#606060', margin: '4px 0 0' }}>Satisfaction</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Copyright bar */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{
              borderTop: '1px solid rgba(255,255,255,0.06)',
              paddingTop: 'clamp(20px, 2vw, 32px)',
              display: 'flex', flexWrap: 'wrap',
              justifyContent: 'space-between', alignItems: 'center', gap: '16px',
            }}
          >
            <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '13px', color: '#404040', margin: 0 }}>
              © {new Date().getFullYear()} {brand?.name || 'SHRAVAN'}. All rights reserved.
            </p>
            <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '13px', color: '#404040', margin: 0 }}>
              Cinematographer & Photographer — {brand?.location || 'Hyderabad, India'}
            </p>
          </motion.div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 809px) {
          .footer-grid {
            flex-direction: column !important;
            gap: clamp(20px, 4vw, 40px) !important;
          }
          .footer-nav-columns {
            flex-direction: column !important;
            gap: clamp(20px, 4vw, 32px) !important;
          }
        }
      `}</style>
    </>
  )
}