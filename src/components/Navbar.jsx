import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
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

const leftPanelVariants = {
  initial: { x: '-100%' },
  animate: { x: 0, transition: { type: 'spring', stiffness: 60, damping: 18, mass: 1 } },
  exit:    { x: '-100%', transition: { type: 'spring', stiffness: 60, damping: 18, mass: 1 } },
}

const rightPanelVariants = {
  initial: { x: '100%' },
  animate: { x: 0, transition: { type: 'spring', stiffness: 60, damping: 18, mass: 1 } },
  exit:    { x: '100%', transition: { type: 'spring', stiffness: 60, damping: 18, mass: 1 } },
}

const linkContainerVariants = {
  animate: { transition: { staggerChildren: 0.06, delayChildren: 0.2 } },
}

const linkItemVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
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
    <nav className="fixed top-0 left-0 right-0 z-[110]"
      style={{
        background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 14.57%, rgba(0,0,0,0) 100%)',
      }}>
      <div className="w-full max-w-[1800px] mx-auto flex items-center justify-between"
        style={{ padding: '20px 40px' }}>

        {/* Left — Contact info (Desktop only) */}
        <div className="hidden desktop:flex flex-col gap-0.5" style={{ minWidth: '200px' }}>
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
        <div className="hidden desktop:flex flex-col items-end gap-0.5" style={{ minWidth: '200px' }}>
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
          className="desktop:hidden flex flex-col items-center justify-center"
          style={{
            background: 'rgba(0,0,0,0.4)',
            borderRadius: '10px',
            padding: '13px',
            border: 'none',
            cursor: 'pointer',
            minWidth: '44px',
            minHeight: '44px',
          }}
          onClick={() => setMenuOpen(!menuOpen)}>
          <span style={{ display: 'block', width: '18px', height: '1px', background: '#fff', marginBottom: '4px' }} />
          <span style={{ display: 'block', width: '14px', height: '1px', background: '#fff', marginBottom: '4px' }} />
          <span style={{ display: 'block', width: '10px', height: '1px', background: '#fff' }} />
        </button>
      </div>

      {/* Mobile fullscreen split-reveal menu */}
      {/* Note: backdrop and panels container are siblings (not nested). DOM order stacks
          panels above backdrop at the same z-[100] — this is intentional. */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-[100]"
              style={{ backgroundColor: 'rgba(0,0,0,0.97)', backdropFilter: 'blur(12px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.25 } }}
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
            />

            {/* Two panels — flex row, fill screen */}
            <div className="fixed inset-0 z-[100] flex overflow-hidden">

              {/* Left panel — Pages */}
              <motion.div
                className="flex-1 flex flex-col justify-center"
                style={{
                  padding: '80px 32px 32px',
                  borderRight: '1px solid rgba(255,255,255,0.06)',
                }}
                variants={leftPanelVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <p style={{
                  fontFamily: '"Geist", sans-serif',
                  fontSize: '14px',
                  color: '#aaa',
                  letterSpacing: '2px',
                  marginBottom: '16px',
                }}>
                  PAGES
                </p>
                <motion.div variants={linkContainerVariants} animate="animate" initial="initial">
                  {/* About is intentionally omitted — matches the existing mobile menu which
                      never included it. The About page is accessible via /about directly. */}
                  {[
                    { label: 'Home',      href: '/'          },
                    { label: 'Portfolio', href: '/portfolio'  },
                    { label: 'My Shots',  href: '/my-shots'  },
                    { label: 'Contact',   href: '/contact'   },
                  ].map(link => (
                    <motion.a
                      key={link.label}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      variants={linkItemVariants}
                      style={{
                        fontFamily: '"Geist", sans-serif',
                        fontSize: '32px',
                        fontWeight: 500,
                        color: '#fff',
                        textDecoration: 'none',
                        letterSpacing: '-0.02em',
                        padding: '8px 0',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        display: 'block',
                      }}
                    >
                      {link.label}
                    </motion.a>
                  ))}
                </motion.div>
              </motion.div>

              {/* Right panel — Social + Contact */}
              <motion.div
                className="flex-1 flex flex-col justify-between"
                style={{ padding: '80px 32px 32px' }}
                variants={rightPanelVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <div>
                  <p style={{
                    fontFamily: '"Geist", sans-serif',
                    fontSize: '14px',
                    color: '#aaa',
                    letterSpacing: '2px',
                    marginBottom: '16px',
                  }}>
                    SOCIAL
                  </p>
                  <motion.div variants={linkContainerVariants} animate="animate" initial="initial">
                    {social?.instagram && (
                      <motion.a
                        href={social.instagram}
                        target="_blank"
                        rel="noopener"
                        onClick={() => setMenuOpen(false)}
                        variants={linkItemVariants}
                        style={{
                          fontFamily: '"Geist", sans-serif',
                          fontSize: '24px',
                          fontWeight: 500,
                          color: '#fff',
                          textDecoration: 'none',
                          padding: '10px 0',
                          borderBottom: '1px solid rgba(255,255,255,0.06)',
                          display: 'block',
                        }}
                      >
                        Instagram
                      </motion.a>
                    )}
                    {social?.youtube && (
                      <motion.a
                        href={social.youtube}
                        target="_blank"
                        rel="noopener"
                        onClick={() => setMenuOpen(false)}
                        variants={linkItemVariants}
                        style={{
                          fontFamily: '"Geist", sans-serif',
                          fontSize: '24px',
                          fontWeight: 500,
                          color: '#fff',
                          textDecoration: 'none',
                          padding: '10px 0',
                          display: 'block',
                        }}
                      >
                        YouTube
                      </motion.a>
                    )}
                  </motion.div>
                </div>

                {/* Contact footer — pinned to bottom */}
                {contact && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}>
                    <a href={`mailto:${contact.email}`}
                      style={{
                        fontFamily: '"Geist", sans-serif',
                        fontSize: '16px',
                        color: '#aaa',
                        textDecoration: 'none',
                        display: 'block',
                      }}>
                      {contact.email}
                    </a>
                    <a href={`tel:${contact.phone}`}
                      style={{
                        fontFamily: '"Geist", sans-serif',
                        fontSize: '16px',
                        color: '#606060',
                        textDecoration: 'none',
                        display: 'block',
                        marginTop: '4px',
                      }}>
                      {contact.phone}
                    </a>
                  </div>
                )}
              </motion.div>

            </div>
          </>
        )}
      </AnimatePresence>
    </nav>
  )
} 