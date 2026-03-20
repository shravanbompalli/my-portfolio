import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'

/*
  Framer template About section — EXACT match:
  - <p> uses display:flex; flex-wrap:wrap (words wrap as units)
  - Each word is a <span> wrapper
  - Each character is a <span> with transition:color 0.2s ease-in-out
  - Default: rgba(187, 187, 187, 1)
  - Revealed: rgb(0, 0, 0)
  - Font: Geist 500, 48px desktop, centered
  - Scroll-linked: characters reveal progressively as you scroll
*/

export default function AboutText() {
  const [bio, setBio] = useState('')
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'about')
        .single()
      if (data) setBio(data.value.bio)
    }
    load()
  }, [])

  // Scroll-linked progress — your original working logic
  useEffect(() => {
    function onScroll() {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const vh = window.innerHeight

      // Check visibility for entrance animation
      if (rect.top < vh && rect.bottom > 0) {
        setVisible(true)
      }

      // Character reveal progress
      const start = vh * 0.85
      const end = vh * 0.15
      if (rect.top >= start) setProgress(0)
      else if (rect.top <= end) setProgress(1)
      else setProgress((start - rect.top) / (start - end))
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!bio) return null

  // Split into words (Framer wraps each word in a <span> for flex-wrap)
  const words = bio.split(/(\s+)/)
  const totalChars = bio.length
  let charIndex = 0

  return (
    <section
      ref={ref}
      style={{
        backgroundColor: '#f5f5f5',
        padding: 'clamp(60px, 8vw, 100px) clamp(18px, 4vw, 40px)',
        overflow: 'hidden',
      }}
    >
      {/* Entrance animation — bounces up when section enters viewport */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ type: 'spring', stiffness: 70, damping: 12, mass: 0.8 }}
        style={{ maxWidth: '1100px', margin: '0 auto' }}
      >
        {/* Framer uses display:flex + flex-wrap on <p> for word wrapping */}
        <p
          style={{
            fontFamily: '"Geist", sans-serif',
            fontSize: 'clamp(24px, 4.5vw, 48px)',
            fontWeight: 500,
            lineHeight: 1.4,
            letterSpacing: '-0.02em',
            textAlign: 'center',
            margin: 0,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {words.map((word, wi) => {
            if (/^\s+$/.test(word)) {
              // Space between words
              const idx = charIndex
              charIndex += word.length
              return <span key={`s-${wi}`} style={{ whiteSpace: 'pre' }}>{word}</span>
            }

            // Each word wrapped in a <span> (matches Framer's flex-wrap word units)
            const wordStart = charIndex
            charIndex += word.length

            return (
              <span key={`w-${wi}`} style={{ whiteSpace: 'nowrap' }}>
                {word.split('').map((char, ci) => {
                  const i = wordStart + ci
                  const threshold = i / totalChars
                  const isRevealed = progress > threshold

                  return (
                    <span
                      key={i}
                      style={{
                        transition: 'color 0.2s ease-in-out',
                        color: isRevealed ? 'rgb(0, 0, 0)' : 'rgba(187, 187, 187, 1)',
                      }}
                    >
                      {char}
                    </span>
                  )
                })}
              </span>
            )
          })}
        </p>
      </motion.div>
    </section>
  )
}