import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'

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
        position: 'relative', width: '100%', minHeight: 'clamp(300px, 50vh, 500px)',
        overflow: 'hidden', backgroundColor: '#e8d8d0',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #e8d0c8, #d0b8b0)' }} />
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          padding: 'clamp(24px, 4vw, 48px) clamp(16px, 4vw, 40px)',
        }}>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.2 }}
            style={{
              fontFamily: '"Geist",sans-serif', fontSize: 'clamp(14px, 2vw, 16px)', fontWeight: 400,
              color: '#fff', lineHeight: 1.5, margin: '0 0 16px', maxWidth: '320px',
              textShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }}
          >
            Let's create timeless photos you'll cherish forever. Book your session today.
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
            style={{
              fontFamily: '"Geist",sans-serif', fontSize: 'clamp(36px, 10vw, 120px)', fontWeight: 700,
              letterSpacing: '-0.04em', lineHeight: 0.9, color: '#000', margin: 0, opacity: 0.15,
            }}
          >
            GET IN TOUCH
          </motion.h1>
        </div>
      </section>

      {/* ── Contact Form ── */}
      <section style={{
        padding: 'clamp(40px, 8vw, 100px) clamp(16px, 4vw, 40px)',
        maxWidth: '1400px', margin: '0 auto',
      }}>
        <div className="contact-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(24px, 4vw, 60px)' }}>

          {/* Left — Info */}
          <motion.div
            className="contact-info-panel"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...spring, delay: 0.1 }}
            style={{
              flex: '1 1 300px', minWidth: '260px',
              backgroundColor: '#fff', borderRadius: '12px', padding: 'clamp(20px, 3vw, 40px)',
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <p style={{
              fontFamily: '"Geist",sans-serif', fontSize: 'clamp(14px, 1.5vw, 16px)', color: '#404040',
              lineHeight: 1.6, margin: '0 0 32px',
            }}>
              Whether it's a portrait, event, or brand shoot, your vision deserves the best.
              Send me a message and I'll get back to you <span style={{ color: '#ff4d00', fontWeight: 500 }}>within 48 hours.</span>
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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
            </div>

            {/* Social links */}
            {(social?.instagram || social?.youtube) && (
              <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
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
              </div>
            )}
          </motion.div>

          {/* Right — Form */}
          <motion.div
            className="contact-form-panel"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...spring, delay: 0.2 }}
            style={{
              flex: '1.5 1 350px', minWidth: '280px',
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
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring, delay: 0.3 + fi * 0.1 }}
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
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring, delay: 0.5 }}
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
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring, delay: 0.6 }}
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
          </motion.div>
        </div>
      </section>

      <style>{`
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
        }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.3); }
      `}</style>
    </div>
  )
}