import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import useReveal from '../lib/useReveal'

/*
  Framer Reviews — EXACT layout:
  - Header: orange dot + "What My Clients Say" | Nav arrows top-right
  - Carousel: slides horizontally, 2 cards visible on desktop
  - Each card: white bg, border-radius 12px
    - Quote: Geist 400, #ddd color (on white bg shows as dark)
    - Stars: 5 orange filled stars
    - Bottom dark bar: avatar (44px) + name + role
  - Nav: black 40x40 rounded-8px buttons
  - 📸 PLACEHOLDER: avatar_url per review
*/

function Stars({ n = 5 }) {
  const c = Math.max(0, Math.min(5, parseInt(n) || 5))
  return (
    <div style={{ display: 'flex', gap: '3px' }}>
      {[...Array(c)].map((_, i) => (
        <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#000">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  )
}

export default function Reviews() {
  const [reviews, setReviews] = useState([])
  const [idx, setIdx] = useState(0)
  const [ref, vis] = useReveal()

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('reviews').select('*').eq('is_active', true).order('sort_order')
      if (data) setReviews(data)
    }
    load()
  }, [])

  const prev = () => setIdx(i => i === 0 ? reviews.length - 1 : i - 1)
  const next = () => setIdx(i => i === reviews.length - 1 ? 0 : i + 1)

  if (!reviews.length) return null

  return (
    <section ref={ref} style={{ backgroundColor: '#f5f5f5', padding: 'clamp(60px,8vw,100px) clamp(18px,4vw,40px)', overflow: 'hidden' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

        {/* Header + Nav arrows */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          marginBottom: 'clamp(32px,4vw,48px)',
          opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.4s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
            <span style={{ fontFamily: '"Geist",sans-serif', fontSize: 'clamp(60px,8vw,100px)', fontWeight: 500, color: '#ff4d00', lineHeight: '0.8', letterSpacing: '-0.02em' }}>.</span>
            <h2 style={{ fontFamily: '"Geist",sans-serif', fontSize: 'clamp(32px,5vw,72px)', fontWeight: 500, color: '#000', lineHeight: 1, letterSpacing: '-0.02em', margin: 0 }}>What My Clients Say</h2>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {[prev, next].map((fn, i) => (
              <button key={i} onClick={fn} style={{
                width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#151515',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background-color 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#ff4d00'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#151515'}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                  {i === 0 ? <path d="M19 12H5M12 19l-7-7 7-7"/> : <path d="M5 12h14M12 5l7 7-7 7"/>}
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Carousel track */}
        <div style={{ overflow: 'hidden' }}>
          <div style={{
            display: 'flex', gap: '20px',
            transform: `translateX(calc(-${idx} * (50% + 10px)))`,
            transition: 'transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94)',
          }} className="reviews-track">
            {reviews.map((r, i) => (
              <div key={r.id} style={{
                flex: '0 0 calc(50% - 10px)', minWidth: '320px',
                backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
                opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(20px)',
                transition: `all 0.4s ease ${0.1 + i * 0.08}s`,
              }} className="review-card">

                {/* Quote + Stars */}
                <div style={{ padding: 'clamp(20px,3vw,32px)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '20px' }}>
                  <p style={{ fontFamily: '"Geist",sans-serif', fontSize: 'clamp(15px,1.5vw,18px)', fontWeight: 400, color: '#222', lineHeight: 1.6, margin: 0 }}>
                    "{r.quote}"
                  </p>
                  <Stars n={r.rating} />
                </div>

                {/* Reviewer — dark bottom bar */}
                <div style={{ backgroundColor: '#000', padding: 'clamp(14px,2vw,20px)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Avatar — 📸 PLACEHOLDER: avatar_url */}
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, backgroundColor: '#333' }}>
                    {r.avatar_url ? (
                      <img src={r.avatar_url} alt={r.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#444,#222)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Geist",sans-serif', fontSize: '16px', fontWeight: 600, color: '#fff' }}>
                        {r.name?.charAt(0) || 'R'}
                      </div>
                    )}
                  </div>
                  <div>
                    <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '15px', fontWeight: 500, color: '#fff', margin: 0 }}>{r.name}</p>
                    <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '13px', color: '#aaa', margin: '2px 0 0 0' }}>{r.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 809px) { .review-card { flex: 0 0 100% !important; min-width: 280px !important; } }
      `}</style>
    </section>
  )
}