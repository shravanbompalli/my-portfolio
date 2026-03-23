import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import Footer from '../components/Footer'
import BlurText from '../components/reactbits/BlurText'
import FadeReveal from '../components/reactbits/FadeReveal'

const spring = { type: 'spring', stiffness: 70, damping: 12, mass: 0.8 }

export default function ContactPage() {
  const [brand, setBrand] = useState(null)
  const [contact, setContact] = useState(null)
  const [social, setSocial] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['brand', 'contact', 'social'])
      if (data) {
        data.forEach(r => {
          if (r.key === 'brand') setBrand(r.value)
          if (r.key === 'contact') setContact(r.value)
          if (r.key === 'social') setSocial(r.value)
        })
      }
    }
    load()
    window.scrollTo(0, 0)
  }, [])

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.message) return
    setSending(true)
    try {
      await supabase.from('contact_messages').insert([{ name: form.name, email: form.email, message: form.message }])
      setSent(true)
      setForm({ name: '', email: '', message: '' })
    } catch (e) { console.error(e) }
    setSending(false)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>

      {/* ── Navbar ── */}
      <div className="page-navbar" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        padding: '20px clamp(16px, 4vw, 40px)', borderBottom: '1px solid rgba(0,0,0,0.06)',
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
      <section style={{ position: 'relative', height: '100dvh', overflow: 'hidden', backgroundColor: '#000' }}>
        {/* Background image */}
        <motion.div
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 40, damping: 10 }}
          style={{ position: 'absolute', inset: 0 }}
        >
          {contact?.contact_image ? (
            <img
              src={contact.contact_image}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a1a1a, #000)' }} />
          )}
        </motion.div>

        {/* Dark overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
          style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1 }}
        />

        {/* Content */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          padding: 'clamp(24px, 6vw, 80px)',
        }}>
          {/* GET IN TOUCH headline */}
          <div className="contact-headline-wrap" style={{
            fontSize: 'clamp(48px, 11vw, 148px)', fontWeight: 700,
            letterSpacing: '-0.04em', color: '#fff', lineHeight: 1, marginBottom: '16px',
          }}>
            <BlurText text="GET IN TOUCH" delay={100} animateBy="words" direction="bottom" />
          </div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 60, damping: 14, delay: 0.5 }}
            style={{
              fontFamily: '"Geist", sans-serif',
              fontSize: 'clamp(16px, 2vw, 22px)',
              color: 'rgba(255,255,255,0.7)',
              margin: '0 0 32px', lineHeight: 1.5,
            }}
          >
            Let's create something timeless together.
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

      {/* ── Contact Form ── */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ type: 'spring', stiffness: 50, damping: 14 }}
        style={{
          padding: 'clamp(40px, 8vw, 100px) clamp(16px, 4vw, 40px)',
          maxWidth: '1400px', margin: '0 auto',
        }}
      >
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ type: 'spring', stiffness: 60, damping: 14, delay: 0.1 }}
          style={{
            fontFamily: '"Geist", sans-serif', fontSize: '12px',
            letterSpacing: '0.15em', textTransform: 'uppercase',
            color: '#aaa', margin: '0 0 clamp(24px, 4vw, 48px)',
          }}
        >
          Reach Out
        </motion.p>
        <div className="contact-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(24px, 4vw, 60px)' }}>

          {/* Left — Info */}
          <FadeReveal y={40} delay={0.1} style={{ flex: '1 1 300px', minWidth: '260px' }}>
          <div
            className="contact-info-panel"
            style={{
              backgroundColor: '#fff', borderRadius: '12px', padding: 'clamp(20px, 3vw, 40px)',
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ type: 'spring', stiffness: 60, damping: 14, delay: 0.05 }}
              style={{
                fontFamily: '"Geist",sans-serif', fontSize: 'clamp(14px, 1.5vw, 16px)', color: '#404040',
                lineHeight: 1.6, margin: '0 0 32px',
              }}
            >
              Whether it's a portrait, event, or brand shoot, your vision deserves the best.
              Send me a message and I'll get back to you <span style={{ color: '#ff4d00', fontWeight: 500 }}>within 48 hours.</span>
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ type: 'spring', stiffness: 60, damping: 14, delay: 0.15 }}
              style={{ display: 'flex', alignItems: 'center', gap: '14px' }}
            >
              <div style={{
                width: '52px', height: '52px', borderRadius: '50%', overflow: 'hidden',
                backgroundColor: '#ddd', flexShrink: 0,
              }}>
                <div style={{
                  width: '100%', height: '100%', background: 'linear-gradient(135deg,#c8c8c8,#a0a0a0)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: '"Geist",sans-serif', fontSize: '20px', fontWeight: 600, color: '#fff',
                }}>S</div>
              </div>
              <div>
                <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '16px', fontWeight: 500, color: '#000', margin: 0 }}>{brand?.name || 'Shravan Bompalli'}</p>
                <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '14px', color: '#aaa', margin: 0 }}>{brand?.title || 'Cinematographer'}</p>
              </div>
            </motion.div>

            {/* Social links */}
            {(social?.instagram || social?.youtube) && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ type: 'spring', stiffness: 60, damping: 14, delay: 0.25 }}
                style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}
              >
                {social?.instagram && (
                  <a href={social.instagram} target="_blank" rel="noopener" style={{
                    fontFamily: '"Geist",sans-serif', fontSize: '14px', fontWeight: 500,
                    color: '#000', backgroundColor: '#f5f5f5', padding: '10px 20px',
                    borderRadius: '40px', textDecoration: 'none', transition: 'all 0.3s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#ff4d00'; e.currentTarget.style.color = '#fff' }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#f5f5f5'; e.currentTarget.style.color = '#000' }}
                  >Instagram</a>
                )}
                {social?.youtube && (
                  <a href={social.youtube} target="_blank" rel="noopener" style={{
                    fontFamily: '"Geist",sans-serif', fontSize: '14px', fontWeight: 500,
                    color: '#000', backgroundColor: '#f5f5f5', padding: '10px 20px',
                    borderRadius: '40px', textDecoration: 'none', transition: 'all 0.3s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#ff4d00'; e.currentTarget.style.color = '#fff' }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#f5f5f5'; e.currentTarget.style.color = '#000' }}
                  >YouTube</a>
                )}
              </motion.div>
            )}
          </div>
          </FadeReveal>

          {/* Right — Form */}
          <FadeReveal y={40} delay={0.25} style={{ flex: '1.5 1 350px', minWidth: '280px' }}>
          <div
            className="contact-form-panel"
            style={{
              backgroundColor: '#000', borderRadius: '12px', padding: 'clamp(20px, 3vw, 40px)',
            }}
          >
            {sent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={spring}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '16px' }}
              >
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.1 }}
                  style={{ fontSize: '48px', color: '#22c55e' }}
                >✓</motion.span>
                <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '20px', fontWeight: 500, color: '#fff', textAlign: 'center' }}>
                  Message sent! I'll get back to you within 48 hours.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSent(false)}
                  style={{
                    fontFamily: '"Geist",sans-serif', fontSize: '14px', fontWeight: 500,
                    color: '#000', backgroundColor: '#ff4d00', border: 'none',
                    padding: '12px 24px', borderRadius: '40px', cursor: 'pointer', marginTop: '8px',
                  }}
                >Send Another Message</motion.button>
              </motion.div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                {[
                  { label: 'Name*', placeholder: 'John Doe', key: 'name', type: 'text' },
                  { label: 'Email address*', placeholder: 'johndoe@gmail.com', key: 'email', type: 'email' },
                ].map((field, fi) => (
                  <motion.div
                    key={field.key}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ type: 'spring', stiffness: 60, damping: 14, mass: 0.8, delay: fi * 0.08 }}
                  >
                    <label style={{ fontFamily: '"Geist",sans-serif', fontSize: '14px', fontWeight: 500, color: '#fff', display: 'block', marginBottom: '8px' }}>
                      {field.label}
                    </label>
                    <input type={field.type} placeholder={field.placeholder} value={form[field.key]}
                      onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                      style={{
                        width: '100%', fontFamily: '"Geist",sans-serif', fontSize: '16px',
                        color: '#fff', backgroundColor: 'transparent', border: 'none',
                        borderBottom: '1px solid rgba(255,255,255,0.2)', padding: '12px 0',
                        outline: 'none', transition: 'border-color 0.3s',
                      }}
                      onFocus={e => e.target.style.borderBottomColor = '#ff4d00'}
                      onBlur={e => e.target.style.borderBottomColor = 'rgba(255,255,255,0.2)'}
                    />
                  </motion.div>
                ))}

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ type: 'spring', stiffness: 60, damping: 14, mass: 0.8, delay: 0.16 }}
                >
                  <label style={{ fontFamily: '"Geist",sans-serif', fontSize: '14px', fontWeight: 500, color: '#fff', display: 'block', marginBottom: '8px' }}>
                    Your message*
                  </label>
                  <textarea placeholder="Tell me about your project..." value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })} rows={4}
                    style={{
                      width: '100%', fontFamily: '"Geist",sans-serif', fontSize: '16px',
                      color: '#fff', backgroundColor: 'transparent', border: 'none',
                      borderBottom: '1px solid rgba(255,255,255,0.2)', padding: '12px 0',
                      outline: 'none', resize: 'none', transition: 'border-color 0.3s',
                    }}
                    onFocus={e => e.target.style.borderBottomColor = '#ff4d00'}
                    onBlur={e => e.target.style.borderBottomColor = 'rgba(255,255,255,0.2)'}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ ...spring, delay: 0.16 }}
                >
                  <motion.button
                    whileHover={{ scale: 1.02, backgroundColor: '#ff6a2a' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSubmit} disabled={sending}
                    style={{
                      fontFamily: '"Geist",sans-serif', fontSize: '15px', fontWeight: 500,
                      color: '#000', backgroundColor: '#ff4d00', padding: '16px 32px',
                      borderRadius: '40px', border: 'none', cursor: 'pointer',
                      width: '100%', opacity: sending ? 0.7 : 1,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    {sending ? 'Sending...' : 'Send Message →'}
                  </motion.button>
                </motion.div>
              </div>
            )}
          </div>
          </FadeReveal>
        </div>
      </motion.section>

      <Footer />

      <style>{`
        .contact-headline-wrap p {
          font-size: inherit !important;
          font-weight: inherit !important;
          letter-spacing: inherit !important;
          line-height: inherit !important;
          color: inherit !important;
          font-family: "Geist", sans-serif !important;
        }
        @media (max-width: 809px) {
          .page-right-nav { display: none !important; }
          .nav-contact, .nav-info { display: none !important; }
          .contact-grid { flex-direction: column !important; }
          .contact-info-panel {
            min-width: 0 !important;
            width: 100% !important;
            flex: 1 1 100% !important;
          }
          .contact-form-panel {
            min-width: 0 !important;
            width: 100% !important;
            flex: 1 1 100% !important;
          }
          .contact-headline-wrap {
            font-size: clamp(32px, 10vw, 64px) !important;
          }
        }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.3); }
      `}</style>
    </div>
  )
}