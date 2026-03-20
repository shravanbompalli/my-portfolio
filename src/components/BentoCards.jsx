import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import useReveal from '../lib/useReveal'

/*
  Framer Bento Cards — EXACT layout:
  - Dark section bg: #000 with BG image + gradient mask
  - Grid lines overlay (6 vertical, rgba(255,255,255,0.05))
  - Header: orange dot + "Capture Beyond the Frame"
  - 7 cards in specific bento layout:
  
  Row 1:  [Card1: 42% tall]  [Card2: white+img top, stats bottom]  [Card3: 44% col with img + 2 small cards]
  Row 2:  [Card4: dark text] [Card5: wide img+text] [Card6: stats] [Card7: photographer portrait]
  
  📸 PLACEHOLDERS: image1-6 in site_settings → bento
*/

function Img({ src, alt, label }) {
  if (src) return <img src={src} alt={alt || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'saturate(1.4)' }} />
  return (
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #2a2a2a, #1a1a1a)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
      <span style={{ fontFamily: '"Geist",sans-serif', fontSize: '11px', color: '#444' }}>{label}</span>
    </div>
  )
}

export default function BentoCards() {
  const [stats, setStats] = useState(null)
  const [bento, setBento] = useState(null)
  const [social, setSocial] = useState(null)
  const [ref, vis] = useReveal()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['stats', 'bento', 'social'])
      if (data) {
        data.forEach(r => {
          if (r.key === 'stats') setStats(r.value)
          if (r.key === 'bento') setBento(r.value)
          if (r.key === 'social') setSocial(r.value)
        })
      }
    }
    load()
  }, [])

  const d = (i) => `${0.1 + i * 0.08}s`
  const anim = (i) => ({
    opacity: vis ? 1 : 0,
    transform: vis ? 'translateY(0)' : 'translateY(20px)',
    transition: `all 0.5s cubic-bezier(0.25,0.1,0.25,1) ${d(i)}`,
  })

  return (
    <section ref={ref} style={{ position: 'relative', backgroundColor: '#000', overflow: 'hidden', padding: 'clamp(60px,8vw,100px) clamp(18px,4vw,40px) clamp(80px,10vw,120px)' }}>

      {/* BG gradient */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 30%, #1a1a1a 0%, #000 70%)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundColor: '#000', mask: 'linear-gradient(0deg, rgba(0,0,0,1) 65%, transparent 100%)', WebkitMask: 'linear-gradient(0deg, rgba(0,0,0,1) 65%, transparent 100%)' }} />

      {/* Grid lines */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, display: 'flex' }}>
        {[...Array(6)].map((_, i) => <div key={i} style={{ flex: 1, borderLeft: '1px solid rgba(255,255,255,0.05)', opacity: i === 3 ? 0 : 1 }} />)}
      </div>

      <div style={{ position: 'relative', zIndex: 2, maxWidth: '1400px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(32px,4vw,48px)', ...anim(0) }}>
          <div style={{ display: 'inline-flex', alignItems: 'flex-end', gap: '2px' }}>
            <span style={{ fontFamily: '"Geist",sans-serif', fontSize: 'clamp(60px,8vw,100px)', fontWeight: 500, color: '#ff4d00', lineHeight: '0.8', letterSpacing: '-0.02em' }}>.</span>
            <h2 style={{ fontFamily: '"Geist",sans-serif', fontSize: 'clamp(32px,5vw,72px)', fontWeight: 500, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em', margin: 0 }}>Capture Beyond the Frame</h2>
          </div>
          <p style={{ fontFamily: '"Geist",sans-serif', fontSize: 'clamp(14px,1.5vw,18px)', color: '#404040', lineHeight: 1.6, maxWidth: '600px', margin: '16px auto 0' }}>
            Expect images that go deeper than the surface, transforming everyday moments into lasting memories.
          </p>
        </div>

        {/* ═══ BENTO GRID ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Row 1 */}
          <div style={{ display: 'flex', gap: '12px', minHeight: '340px' }} className="bento-row">

            {/* Card 1 — Dark tall, outdoor image + text overlay */}
            <div style={{ flex: '0 0 27%', borderRadius: '12px', overflow: 'hidden', position: 'relative', backgroundColor: '#111', ...anim(1) }} className="bento-card-tall">
              <Img src={bento?.image1} label="Outdoor Shot" />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
                <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '15px', fontWeight: 500, color: '#fff', margin: 0, lineHeight: 1.4 }}>
                  Indoor or Outdoor? I adapt seamlessly to any setting to capture the perfect shot.
                </p>
              </div>
            </div>

            {/* Card 2 — Portrait grid mosaic + stats text */}
            <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '12px', ...anim(2) }}>
              <div style={{ flex: 1, borderRadius: '12px', overflow: 'hidden', position: 'relative', backgroundColor: '#111' }}>
                <Img src={bento?.image2} label="Portrait Mosaic" />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
                  <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '15px', fontWeight: 500, color: '#fff', margin: 0, lineHeight: 1.4 }}>
                    Proven Experience & Trusted by Many: With over {stats?.projects || '50'}+ projects and {stats?.satisfaction || '98'}% satisfied clients.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3 — Camera lens dark card with text */}
            <div style={{ flex: '0 0 27%', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#000', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', ...anim(3) }} className="bento-card-tall">
              <div style={{ position: 'absolute', bottom: '-12px', left: '-105px', width: '348px', aspectRatio: '0.7', overflow: 'hidden' }}>
                <Img src={bento?.image3} label="Camera Lens" />
              </div>
              <div style={{ position: 'relative', zIndex: 1, padding: '24px 24px 24px 100px', display: 'flex', alignItems: 'center', height: '100%' }}>
                <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '15px', fontWeight: 400, color: '#eee', margin: 0, lineHeight: 1.5 }}>
                  Every equipment I shoot with is top-quality. This ensures every image is crisp, detailed, and ready for any use — print or digital.
                </p>
              </div>
            </div>
          </div>

          {/* Row 2 */}
          <div style={{ display: 'flex', gap: '12px', minHeight: '280px' }} className="bento-row">

            {/* Card 4 — White card with conference/event image */}
            <div style={{ flex: '0 0 44%', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', ...anim(4) }} className="bento-card-wide">
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <Img src={bento?.image4} label="Conference/Event" />
              </div>
              <div style={{ padding: '16px 20px' }}>
                <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '14px', color: '#404040', margin: 0 }}>Professional event coverage</p>
              </div>
            </div>

            {/* Card 5 — Before/after editing comparison */}
            <div style={{ flex: 1, borderRadius: '12px', overflow: 'hidden', position: 'relative', backgroundColor: '#111', ...anim(5) }}>
              <Img src={bento?.image5} label="Before/After Edit" />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
                <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '14px', fontWeight: 500, color: '#fff', margin: 0 }}>
                  Editing That Elevates, Not Alters: Every touch enhances the emotion of your photos.
                </p>
              </div>
            </div>

            {/* Card 6 — Stats card (satisfied clients) */}
            <div style={{ flex: '0 0 20%', borderRadius: '12px', backgroundColor: '#fff', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '8px', ...anim(6) }} className="bento-card-stats">
              <span style={{ fontFamily: '"Geist",sans-serif', fontSize: '52px', fontWeight: 500, color: '#000', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {stats?.projects || '80'}<span style={{ color: '#ff4d00' }}>+</span>
              </span>
              <span style={{ fontFamily: '"Geist",sans-serif', fontSize: '14px', color: '#aaa' }}>satisfied clients</span>
              {/* Star rating */}
              <div style={{ display: 'flex', gap: '2px', marginTop: '4px' }}>
                {[...Array(5)].map((_, i) => (
                  <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#000"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                ))}
              </div>
              <span style={{ fontFamily: '"Geist",sans-serif', fontSize: '14px', color: '#aaa' }}>Photos captured</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 809px) {
          .bento-row { flex-direction: column !important; }
          .bento-card-tall, .bento-card-wide, .bento-card-stats { flex: 1 1 100% !important; min-height: 200px !important; }
        }
      `}</style>
    </section>
  )
}