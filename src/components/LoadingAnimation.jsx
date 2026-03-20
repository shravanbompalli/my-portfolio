import { useState, useEffect, useRef } from 'react'

/*
  Framer template Loading Animation — EXACT replica:
  
  Layout:
  ┌────┬────┬────┬────┬────┐
  │    │    │ 42 │    │    │  ← 5 black blocks, each 20% width
  │  1 │  2 │ %  │  4 │  5 │  ← Counter centered in block 3
  │    │    │    │    │    │
  └────┴────┴────┴────┴────┘
  
  Sequence:
  1. Page loads → counter counts 0 → 100 (Geist Mono, white number + orange %)
  2. At 100% → blocks collapse upward (height 100% → 0%)
  3. Each block staggers slightly for cinematic reveal
  4. Content appears behind as blocks shrink away
  
  Framer CSS details:
  - Blocks container: flex row, space-between, position absolute, inset with -12px top, -1px sides
  - Each block: 20% width, 100% height, bg #000
  - Counter: Geist Mono, 500 weight, 32px, white number, orange % sign
  - Counter container: position absolute, top 50%, left 50%, translate(-50%,-50%)
  - Reveal: blocks animate height from 100% → 1% with spring easing
  - Block stagger: center block first, then outward (3→2,4→1,5)
*/

export default function LoadingAnimation({ onComplete }) {
  const [count, setCount] = useState(0)
  const [phase, setPhase] = useState('counting') // 'counting' | 'holding' | 'revealing' | 'done'
  const rafRef = useRef()
  const startRef = useRef()

  // Phase 1: Count from 0 → 100 with eased timing
  useEffect(() => {
    if (phase !== 'counting') return

    const duration = 3500 // 3.5 seconds to count
    startRef.current = performance.now()

    const animate = (now) => {
      const elapsed = now - startRef.current
      const progress = Math.min(elapsed / duration, 1)

      // Ease-out cubic for natural deceleration at the end
      const eased = 1 - Math.pow(1 - progress, 3)
      const value = Math.floor(eased * 100)

      setCount(value)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        setCount(100)
        // Brief hold at 100% before revealing
        setTimeout(() => setPhase('revealing'), 600)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [phase])

  // Phase 2: After reveal animation completes, notify parent
  useEffect(() => {
    if (phase !== 'revealing') return

    // Total reveal duration: longest stagger (block 1 & 5) + transition time
    const revealDuration = 1800
    const timer = setTimeout(() => {
      setPhase('done')
      onComplete?.()
    }, revealDuration)

    return () => clearTimeout(timer)
  }, [phase, onComplete])

  if (phase === 'done') return null

  // Block stagger delays (center out): block3=0ms, block2&4=120ms, block1&5=240ms
  const staggerDelays = [240, 120, 0, 120, 240]

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        pointerEvents: phase === 'revealing' ? 'none' : 'all',
      }}
    >
      {/* 5 Blocks Container — matches Framer's framer-lvj0t6 */}
      <div
        style={{
          position: 'absolute',
          top: '-12px',
          left: '-1px',
          right: '-1px',
          height: 'calc(100% + 12px)',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          overflow: 'hidden',
        }}
      >
        {[1, 2, 3, 4, 5].map((blockNum, i) => (
          <div
            key={blockNum}
            style={{
              width: '20%',
              height: phase === 'revealing' ? '0%' : '100%',
              backgroundColor: '#000',
              position: 'relative',
              overflow: 'visible',
              // Spring-like easing for the reveal
              transition: phase === 'revealing'
                ? `height 1.1s cubic-bezier(0.76, 0, 0.24, 1) ${staggerDelays[i]}ms`
                : 'none',
              transformOrigin: 'top center',
            }}
          >
            {/* Counter only in block 3 (center) */}
            {blockNum === 3 && (
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '16px',
                  // Fade out counter slightly before blocks collapse
                  opacity: phase === 'revealing' ? 0 : 1,
                  transition: 'opacity 0.25s ease',
                }}
              >
                {/* Counter display — Geist Mono */}
                <div
                  role="status"
                  aria-live="polite"
                  aria-label={`Loading: ${count}%`}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'flex-start',
                    fontFamily: '"Geist Mono", monospace',
                    fontWeight: 500,
                    fontSize: '32px',
                    letterSpacing: '0em',
                    lineHeight: '1em',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'baseline',
                      gap: '4px',
                      fontVariantNumeric: 'tabular-nums',
                      userSelect: 'none',
                    }}
                  >
                    {/* Number — white */}
                    <span style={{ color: '#fff' }}>
                      {count}
                    </span>
                    {/* Percent sign — orange (#ff4d00) */}
                    <span style={{ color: '#ff4d00' }} aria-hidden="true">
                      %
                    </span>
                  </div>
                </div>

                {/* Loading bar beneath counter */}
                <div
                  style={{
                    width: '120px',
                    height: '2px',
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    borderRadius: '1px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${count}%`,
                      height: '100%',
                      backgroundColor: '#ff4d00',
                      borderRadius: '1px',
                      transition: 'width 0.05s linear',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}