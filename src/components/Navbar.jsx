import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/* Nav link with orange hover-reveal text (matches Framer QB9PT component) */
function NavLink({ href, label, target, rel }) {
  const [hov, setHov] = useState(false)
  return (
    <a href={href} target={target} rel={rel}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="relative block overflow-hidden"
      style={{ textDecoration: 'none' }}>
      {/* Default white text */}
      <span className="block transition-transform duration-300"
        style={{
          fontFamily: '"Geist", sans-serif',
          fontSize: '18px',
          fontWeight: 500,
          letterSpacing: '0.03em',
          color: '#fff',
          textDecoration: 'underline',
          textDecorationOffset: '3px',
          textDecorationThickness: '2px',
          transform: hov ? 'translateY(-100%)' : 'translateY(0)',
        }}>
        {label}
      </span>
      {/* Orange hover text */}
      <span className="absolute left-0 top-full block transition-transform duration-300"
        style={{
          fontFamily: '"Geist", sans-serif',
          fontSize: '18px',
          fontWeight: 500,
          letterSpacing: '0.03em',
          color: '#ff4d00',
          textDecoration: 'underline',
          textDecorationOffset: '3px',
          textDecorationThickness: '2px',
          transform: hov ? 'translateY(-100%)' : 'translateY(0)',
        }}>
        {label}
      </span>
    </a>
  )
}

export default function Navbar() {
  const [brand, setBrand] = useState(null)
  const [contact, setContact] = useState(null)
  const [social, setSocial] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

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
  }, [])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 14.57%, rgba(0,0,0,0) 100%)',
      }}>
      <div className="w-full max-w-[1800px] mx-auto flex items-center justify-between"
        style={{ padding: '20px 40px' }}>

        {/* Left — Contact info (Desktop only) */}
        <div className="hidden md:flex flex-col gap-0.5" style={{ minWidth: '200px' }}>
          {contact && (
            <>
              <a href={`mailto:${contact.email}`}
                style={{
                  fontFamily: '"Geist", sans-serif',
                  fontSize: '15px',
                  fontWeight: 400,
                  color: '#aaa',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.target.style.color = '#ff4d00'}
                onMouseLeave={e => e.target.style.color = '#aaa'}>
                {contact.email}
              </a>
              <a href={`tel:${contact.phone}`}
                style={{
                  fontFamily: '"Geist", sans-serif',
                  fontSize: '13px',
                  fontWeight: 400,
                  color: '#606060',
                  textDecoration: 'none',
                }}>
                {contact.phone}
              </a>
            </>
          )}
        </div>

        {/* Center — Logo / Brand name */}
        <a href="#hero" style={{ textDecoration: 'none' }}>
          <span style={{
            fontFamily: '"Geist", sans-serif',
            fontSize: '22px',
            fontWeight: 600,
            letterSpacing: '0.05em',
            color: '#fff',
          }}>
            {brand?.name || 'SHRAVAN'}
          </span>
        </a>

        {/* Right — Title + Location (Desktop only) */}
        <div className="hidden md:flex flex-col items-end gap-0.5" style={{ minWidth: '200px' }}>
          {brand && (
            <>
              <span style={{
                fontFamily: '"Geist", sans-serif',
                fontSize: '15px',
                fontWeight: 400,
                color: '#aaa',
              }}>
                {brand.title}
              </span>
              <span style={{
                fontFamily: '"Geist", sans-serif',
                fontSize: '13px',
                fontWeight: 400,
                color: '#606060',
              }}>
                {brand.location}
              </span>
            </>
          )}
        </div>

        {/* Mobile menu button (Phone only) */}
        <button
          className="md:hidden flex flex-col items-center justify-center"
          style={{
            background: 'rgba(0,0,0,0.4)',
            borderRadius: '10px',
            padding: '12px',
            border: 'none',
            cursor: 'pointer',
          }}
          onClick={() => setMenuOpen(!menuOpen)}>
          <span style={{ display: 'block', width: '18px', height: '1px', background: '#fff', marginBottom: '4px' }} />
          <span style={{ display: 'block', width: '14px', height: '1px', background: '#fff', marginBottom: '4px' }} />
          <span style={{ display: 'block', width: '10px', height: '1px', background: '#fff' }} />
        </button>
      </div>

      {/* Mobile fullscreen menu */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] flex flex-col"
          style={{ backgroundColor: 'rgba(0,0,0,0.97)', backdropFilter: 'blur(12px)' }}>

          {/* Close button */}
          <div className="flex justify-end" style={{ padding: '20px' }}>
            <button onClick={() => setMenuOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '10px',
                padding: '12px',
                border: 'none',
                cursor: 'pointer',
              }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Nav sections */}
          <div className="flex-1 flex flex-col justify-center" style={{ padding: '0 32px', gap: '40px' }}>

            {/* Pages */}
            <div className="flex flex-col" style={{ gap: '8px' }}>
              <p style={{ fontFamily: '"Geist", sans-serif', fontSize: '14px', color: '#aaa', marginBottom: '8px' }}>
                Pages
              </p>
              {[
                { label: 'Home', href: '#hero' },
                { label: 'My Shots', href: '#portfolio' },
                { label: 'Contact', href: '#contact' },
              ].map(l => (
                <a key={l.label} href={l.href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    fontFamily: '"Geist", sans-serif',
                    fontSize: '32px',
                    fontWeight: 500,
                    color: '#fff',
                    textDecoration: 'none',
                    letterSpacing: '-0.02em',
                    padding: '8px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}>
                  {l.label}
                </a>
              ))}
            </div>

            {/* Others */}
            <div className="flex flex-col" style={{ gap: '8px' }}>
              <p style={{ fontFamily: '"Geist", sans-serif', fontSize: '14px', color: '#aaa', marginBottom: '8px' }}>
                Others
              </p>
              {social?.instagram && (
                <a href={social.instagram} target="_blank" rel="noopener"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    fontFamily: '"Geist", sans-serif',
                    fontSize: '24px',
                    fontWeight: 500,
                    color: '#fff',
                    textDecoration: 'none',
                    padding: '6px 0',
                  }}>
                  Instagram
                </a>
              )}
              {social?.youtube && (
                <a href={social.youtube} target="_blank" rel="noopener"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    fontFamily: '"Geist", sans-serif',
                    fontSize: '24px',
                    fontWeight: 500,
                    color: '#fff',
                    textDecoration: 'none',
                    padding: '6px 0',
                  }}>
                  YouTube
                </a>
              )}
            </div>
          </div>

          {/* Bottom contact */}
          {contact && (
            <div className="flex flex-col" style={{ padding: '24px 32px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <a href={`mailto:${contact.email}`}
                style={{ fontFamily: '"Geist", sans-serif', fontSize: '14px', color: '#aaa', textDecoration: 'none' }}>
                {contact.email}
              </a>
              <a href={`tel:${contact.phone}`}
                style={{ fontFamily: '"Geist", sans-serif', fontSize: '14px', color: '#606060', textDecoration: 'none', marginTop: '4px' }}>
                {contact.phone}
              </a>
            </div>
          )}
        </div>
      )}
    </nav>
  )
} 