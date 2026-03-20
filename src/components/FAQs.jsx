import { useState } from 'react'
import useReveal from '../lib/useReveal'

/*
  Framer FAQs section:
  - Header: orange dot + "FAQs" centered
  - Subtitle: "Everything you need to know before we start..."
  - Accordion items:
    - White bg cards, border-radius 12px
    - Question text + circular black icon (plus/minus)
    - Expanded: answer text
  - bg: #f5f5f5
  - Padding: 120px 40px
  
  NOTE: FAQ data is hardcoded for now — will be made dynamic via admin panel later
*/

const faqData = [
  {
    q: 'How do I book a session with you?',
    a: 'You can book a session by reaching out through the contact form on this website, sending me an email, or DMing me on Instagram. I\'ll get back to you within 48 hours to discuss your vision and schedule a date.',
  },
  {
    q: 'How long does it take to receive my edited photos?',
    a: 'Delivery typically takes 7-14 business days depending on the project size. For weddings and large events, it may take up to 3 weeks. Rush delivery is available upon request.',
  },
  {
    q: 'What is your pricing structure?',
    a: 'Pricing varies based on the type of shoot, duration, and deliverables. I offer packages for portraits, events, weddings, and commercial work. Contact me for a custom quote tailored to your needs.',
  },
  {
    q: 'Do you travel for shoots?',
    a: 'Yes! I\'m based in Hyderabad but available for travel across India and internationally. Travel costs may apply depending on the location.',
  },
  {
    q: 'What should I wear or bring to a photoshoot?',
    a: 'I\'ll send you a detailed preparation guide after booking. Generally, solid colors work best, and I recommend bringing 2-3 outfit changes. I\'ll also help with posing and direction during the shoot.',
  },
  {
    q: 'Can I request specific edits or styles?',
    a: 'Absolutely! I work closely with every client to understand their vision. Whether you want a cinematic look, bright and airy, or moody tones — I\'ll match the editing style to your preference.',
  },
]

export default function FAQs() {
  const [active, setActive] = useState(-1)
  const [ref, vis] = useReveal()

  return (
    <section ref={ref} style={{
      backgroundColor: '#f5f5f5',
      padding: 'clamp(60px,8vw,120px) clamp(18px,4vw,40px)',
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{
          textAlign: 'center', marginBottom: 'clamp(32px,4vw,60px)',
          opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.4s ease',
        }}>
          <div style={{ display: 'inline-flex', alignItems: 'flex-end', gap: '2px', marginBottom: '12px' }}>
            <span style={{ fontFamily: '"Geist",sans-serif', fontSize: 'clamp(60px,8vw,100px)', fontWeight: 500, color: '#ff4d00', lineHeight: '0.8', letterSpacing: '-0.02em' }}>.</span>
            <h2 style={{ fontFamily: '"Geist",sans-serif', fontSize: 'clamp(32px,5vw,72px)', fontWeight: 500, color: '#000', lineHeight: 1, letterSpacing: '-0.02em', margin: 0 }}>FAQs</h2>
          </div>
          <p style={{ fontFamily: '"Geist",sans-serif', fontSize: 'clamp(14px,1.5vw,18px)', color: '#404040', lineHeight: 1.6, margin: 0 }}>
            Everything you need to know before we start. Quick answers to the questions clients ask most.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {faqData.map((faq, i) => {
            const isOpen = active === i
            return (
              <div key={i}
                onClick={() => setActive(isOpen ? -1 : i)}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: vis ? 1 : 0,
                  transform: vis ? 'translateY(0)' : 'translateY(12px)',
                  transitionDelay: `${0.05 + i * 0.04}s`,
                }}>

                {/* Question row */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '18px 20px', gap: '16px',
                }}>
                  <p style={{
                    fontFamily: '"Geist",sans-serif', fontSize: '16px', fontWeight: 500,
                    color: '#000', margin: 0, lineHeight: 1.4, flex: 1,
                  }}>
                    {faq.q}
                  </p>

                  {/* Circle icon — black bg, plus/minus */}
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    backgroundColor: '#000', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'transform 0.3s ease, background-color 0.3s',
                    transform: isOpen ? 'rotate(45deg)' : 'rotate(0)',
                    ...(isOpen && { backgroundColor: '#ff4d00' }),
                  }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="1.5">
                      <line x1="7" y1="1" x2="7" y2="13" />
                      <line x1="1" y1="7" x2="13" y2="7" />
                    </svg>
                  </div>
                </div>

                {/* Answer — collapsible */}
                <div style={{
                  maxHeight: isOpen ? '300px' : '0',
                  opacity: isOpen ? 1 : 0,
                  transition: 'max-height 0.4s ease, opacity 0.3s ease',
                  overflow: 'hidden',
                }}>
                  <div style={{ padding: '0 20px 20px' }}>
                    <p style={{
                      fontFamily: '"Geist",sans-serif', fontSize: '15px', fontWeight: 400,
                      color: '#606060', lineHeight: 1.6, margin: 0,
                    }}>
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}