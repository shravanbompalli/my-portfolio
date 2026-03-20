import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'

const spring = { type: 'spring', stiffness: 70, damping: 12, mass: 0.8 }

export default function Portfolio({ limit }) {
  const [projects, setProjects] = useState([])
  const [hov, setHov] = useState(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
      if (data) setProjects(data)
    }
    load()
  }, [])

  if (!projects.length) return null

  const shown = limit ? projects.slice(0, limit) : projects
  const hasMore = limit && projects.length > limit

  return (
    <section
      id="portfolio"
      style={{
        backgroundColor: '#f5f5f5',
        padding: 'clamp(60px, 8vw, 100px) clamp(18px, 4vw, 40px)',
      }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={spring}
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
            }}>Selected Work</h2>
          </div>

          {hasMore && (
            <Link
              to="/portfolio"
              style={{
                fontFamily: '"Geist", sans-serif',
                fontSize: '16px', fontWeight: 500,
                color: '#000', textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: '6px',
                transition: 'color 0.3s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#ff4d00'}
              onMouseLeave={e => e.currentTarget.style.color = '#000'}
            >
              View All Work
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </motion.div>

        <div
          className="portfolio-grid"
          style={{
            columns: '2',
            columnGap: 'clamp(12px, 2vw, 24px)',
          }}
        >
          {shown.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ ...spring, delay: 0.1 * i }}
              onMouseEnter={() => setHov(i)}
              onMouseLeave={() => setHov(null)}
              style={{
                breakInside: 'avoid',
                marginBottom: 'clamp(12px, 2vw, 24px)',
              }}
            >
              <Link
                to={`/portfolio/${p.slug || p.id}`}
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <div style={{
                  position: 'relative', borderRadius: '12px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    filter: 'saturate(1.4)',
                    transform: hov === i ? 'scale(1.05)' : 'scale(1)',
                    transition: 'transform 0.6s ease',
                  }}>
                    {p.cover_image ? (
                      <img src={p.cover_image} alt={p.title}
                        style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
                    ) : (
                      <div style={{
                        width: '100%', aspectRatio: i % 2 === 0 ? '4/5' : '3/4',
                        background: `linear-gradient(135deg, hsl(${i * 60}, 10%, 25%), hsl(${i * 60}, 10%, 15%))`,
                      }} />
                    )}
                  </div>

                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(transparent 40%, rgba(0,0,0,0.85) 100%)',
                    pointerEvents: 'none',
                  }} />

                  <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 2 }}>
                    <span style={{
                      fontFamily: '"Geist", sans-serif', fontSize: '13px', fontWeight: 400,
                      color: '#000', backgroundColor: '#eee',
                      padding: '6px 10px', borderRadius: '40px',
                    }}>
                      {p.category}
                    </span>
                  </div>

                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2,
                    padding: 'clamp(16px, 2vw, 24px)',
                    display: 'flex', flexDirection: 'column', gap: '4px',
                  }}>
                    <h4 style={{
                      fontFamily: '"Geist", sans-serif',
                      fontSize: 'clamp(18px, 2.5vw, 28px)',
                      fontWeight: 500, color: '#fff', margin: 0, letterSpacing: '-0.01em',
                    }}>
                      {p.title}
                    </h4>
                    <p style={{
                      fontFamily: '"Geist", sans-serif',
                      fontSize: 'clamp(13px, 1.2vw, 16px)',
                      fontWeight: 400, color: 'rgba(255,255,255,0.7)',
                      margin: 0, lineHeight: 1.5, maxWidth: '400px',
                    }}>
                      {p.description}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 809px) {
          .portfolio-grid { columns: 1 !important; }
        }
      `}</style>
    </section>
  )
}