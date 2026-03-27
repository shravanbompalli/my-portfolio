import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { supabase } from '../lib/supabase'

const revealSpring = { type: 'spring', stiffness: 70, damping: 12, mass: 0.8 }

export default function Services() {
  const [services, setServices] = useState([])
  const [active, setActive] = useState(-1)
  const [hovered, setHovered] = useState(-1)
  const containerRef = useRef(null)

  // Smooth spring-animated mouse position
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const smoothX = useSpring(mouseX, { stiffness: 60, damping: 20, mass: 0.8 })
  const smoothY = useSpring(mouseY, { stiffness: 60, damping: 20, mass: 0.8 })

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
      if (data) setServices(data)
    }
    load()
  }, [])

  function handleMouseMove(e) {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left - 140)
    mouseY.set(e.clientY - rect.top - 175)
  }

  if (!services.length) return null

  const hoveredService = hovered !== -1 ? services[hovered] : null

  return (
    <section
      id="services"
      style={{
        backgroundColor: '#f5f5f5',
        padding: 'clamp(60px, 8vw, 100px) clamp(18px, 4vw, 40px)',
      }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ ...revealSpring, delay: 0 }}
          style={{
            display: 'flex', flexWrap: 'wrap',
            justifyContent: 'space-between', alignItems: 'flex-end',
            gap: '20px', marginBottom: 'clamp(40px, 5vw, 64px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
            <span style={{
              fontFamily: '"Geist", sans-serif',
              fontSize: 'clamp(60px, 8vw, 100px)',
              fontWeight: 500, color: '#ff4d00',
              lineHeight: '0.8', letterSpacing: '-0.02em',
            }}>.</span>
            <h2 style={{
              fontFamily: '"Geist", sans-serif',
              fontSize: 'clamp(32px, 5vw, 72px)',
              fontWeight: 500, color: '#000',
              lineHeight: 1, letterSpacing: '-0.02em', margin: 0,
            }}>Services I offer</h2>
          </div>
          <p style={{
            fontFamily: '"Geist", sans-serif',
            fontSize: 'clamp(14px, 1.5vw, 18px)',
            fontWeight: 400, color: '#404040',
            lineHeight: 1.6, maxWidth: '520px', margin: 0,
          }}>
            From portraits to events, professional cinematography and photography crafted to match your vision.
          </p>
        </motion.div>

        {/* ── Accordion + Floating Image Container ── */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          style={{ position: 'relative' }}
        >
          {/* Accordion rows */}
          {services.map((s, i) => {
            const isActive = active === i
            const isHovered = hovered === i

            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ ...revealSpring, delay: 0.05 * i }}
                whileTap={{ scale: 0.98 }}
                style={{ borderTop: '1px solid rgba(0,0,0,0.1)' }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(-1)}
              >
                <div
                  onClick={() => setActive(isActive ? -1 : i)}
                  style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'clamp(16px, 2.5vw, 28px) 0',
                    cursor: 'pointer',
                    minHeight: '44px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'clamp(16px, 3vw, 32px)' }}>
                    <span style={{
                      fontFamily: '"Geist Mono", monospace',
                      fontSize: 'clamp(28px, 5vw, 64px)',
                      fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1,
                      color: isActive || isHovered ? '#ff4d00' : '#ddd',
                      transition: 'color 0.3s ease',
                      minWidth: 'clamp(40px, 6vw, 80px)',
                    }}>
                      {String(s.number || i + 1).padStart(2, '0')}
                    </span>
                    <h3 style={{
                      fontFamily: '"Geist", sans-serif',
                      fontSize: 'clamp(20px, 3.5vw, 44px)',
                      fontWeight: 500, letterSpacing: '-0.02em',
                      lineHeight: 1.1, color: '#000', margin: 0,
                      paddingTop: 'clamp(4px, 0.5vw, 8px)',
                    }}>
                      {s.title}
                    </h3>
                  </div>

                  <motion.div
                    animate={{ rotate: isActive ? 45 : 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    style={{
                      width: '32px', height: '32px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#000" strokeWidth="1.5">
                      <line x1="9" y1="1" x2="9" y2="17" />
                      <line x1="1" y1="9" x2="17" y2="9" />
                    </svg>
                  </motion.div>
                </div>

                <AnimatePresence initial={false}>
                  {isActive && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{
                        display: 'flex', flexDirection: 'column', gap: '16px',
                        paddingBottom: '28px', paddingLeft: 'clamp(56px, 9vw, 112px)',
                      }}>
                        <motion.p
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1, duration: 0.3 }}
                          style={{
                            fontFamily: '"Geist", sans-serif',
                            fontSize: 'clamp(14px, 1.3vw, 16px)',
                            fontWeight: 400, color: '#404040',
                            lineHeight: 1.6, maxWidth: '540px', margin: 0,
                          }}
                        >
                          {s.description}
                        </motion.p>
                        {s.tags && s.tags.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15, duration: 0.3 }}
                            style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}
                          >
                            {s.tags.map(tag => (
                              <span key={tag} style={{
                                fontFamily: '"Geist", sans-serif',
                                fontSize: '13px', fontWeight: 400,
                                color: '#fff', backgroundColor: '#000',
                                padding: '6px 14px', borderRadius: '40px',
                              }}>
                                {tag}
                              </span>
                            ))}
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
          <div style={{ borderTop: '1px solid rgba(0,0,0,0.1)' }} />

          {/* ══ SINGLE floating image — lives OUTSIDE rows ══ 
              This is ONE element that persists and smoothly transitions.
              The image src crossfades, the position follows mouse with spring. */}
          <motion.div
            className="services-floating-image"
            style={{
              position: 'absolute',
              left: smoothX,
              top: smoothY,
              width: '280px',
              height: '350px',
              borderRadius: '12px',
              overflow: 'hidden',
              pointerEvents: 'none',
              zIndex: 10,
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              opacity: hovered !== -1 ? 1 : 0,
              scale: hovered !== -1 ? 1 : 0.7,
              transition: 'opacity 0.4s cubic-bezier(0.16,1,0.3,1), scale 0.4s cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            {/* Stack ALL service images on top of each other, 
                only the hovered one is visible — creates smooth crossfade */}
            {services.map((s, i) => (
              <div
                key={s.id}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: hovered === i ? 1 : 0,
                  transition: 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                {s.image_url ? (
                  <img
                    src={s.image_url}
                    alt={s.title}
                    style={{
                      width: '100%', height: '100%',
                      objectFit: 'cover', display: 'block',
                      filter: 'saturate(1.4)',
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%', height: '100%',
                    background: `linear-gradient(135deg, hsl(${i * 40 + 20}, 8%, 82%), hsl(${i * 40 + 20}, 8%, 72%))`,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: '8px',
                  }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                    <span style={{ fontFamily: '"Geist",sans-serif', fontSize: '12px', color: '#bbb' }}>
                      {s.title}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        </div>
      </div>
      <style>{`
        .services-floating-image { display: block; }
        @media (max-width: 809px) {
          .services-floating-image { display: none !important; }
        }
      `}</style>
    </section>
  )
}