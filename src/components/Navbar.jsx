import React, { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from '../lib/supabase'

/*
  Navbar — floating hamburger button (tablet/mobile only) + split-reveal overlay.

  The full-width 3-column top bar (contact / brand / title+location) lives in
  each page's own inline navbar — styled correctly for that page's background.
  This component adds only the hamburger trigger and the fullscreen split panel
  on top of every page, so navigation works on all breakpoints without doubling.
*/

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
  const [contact, setContact] = useState(null)
  const [social, setSocial] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['contact', 'social'])
      if (data) {
        data.forEach(r => {
          if (r.key === 'contact') setContact(r.value)
          if (r.key === 'social') setSocial(r.value)
        })
      }
    }
    load()
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <>
      {/* ── Floating hamburger button — tablet/mobile only ── */}
      <button
        className="desktop:hidden fixed z-[110]"
        style={{
          top: '18px',
          right: 'clamp(16px, 4vw, 40px)',
          background: menuOpen ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.4)',
          borderRadius: '10px',
          border: 'none',
          cursor: 'pointer',
          minWidth: '44px',
          minHeight: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.25s',
          padding: '13px',
        }}
        onClick={() => setMenuOpen(!menuOpen)}>
        <div style={{ width: '18px', height: '11px', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <motion.span
            style={{ display: 'block', height: '1px', background: '#fff', transformOrigin: 'center' }}
            animate={menuOpen ? { rotate: 45, y: 5, width: 18 } : { rotate: 0, y: 0, width: 18 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          />
          <motion.span
            style={{ display: 'block', height: '1px', background: '#fff' }}
            animate={menuOpen ? { opacity: 0 } : { opacity: 1 }}
            transition={{ duration: 0.15 }}
          />
          <motion.span
            style={{ display: 'block', height: '1px', background: '#fff', transformOrigin: 'center', width: 10 }}
            animate={menuOpen ? { rotate: -45, y: -5, width: 18 } : { rotate: 0, y: 0, width: 10 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          />
        </div>
      </button>

      {/* ── Fullscreen split-reveal menu ── */}
      <AnimatePresence>
        {menuOpen && (
          <React.Fragment key="mobile-menu">
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
                        rel="noopener noreferrer"
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
                        rel="noopener noreferrer"
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
          </React.Fragment>
        )}
      </AnimatePresence>
    </>
  )
}
