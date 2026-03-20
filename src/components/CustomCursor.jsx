import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion'

/*
  Cinematic "Lens Focus" Cursor
  
  - Outer ring: camera aperture that smoothly follows cursor with delay
  - Inner dot: precise position marker (instant follow)
  - On hover (links/buttons): ring expands + rotates + fills with orange tint
  - On images: crosshair viewfinder mode
  - On click: shutter snap animation (ring contracts rapidly)
  - Trail particles: small dots that fade out behind the cursor
  - Magnetic pull: cursor slightly pulls toward nearby interactive elements
  - Hidden on mobile/touch devices
*/

const TRAIL_COUNT = 8

export default function CustomCursor() {
  const [hovering, setHovering] = useState(false)
  const [clicking, setClicking] = useState(false)
  const [onImage, setOnImage] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Raw mouse position
  const mouseX = useMotionValue(-100)
  const mouseY = useMotionValue(-100)

  // Smooth spring for outer ring (laggy follow)
  const ringX = useSpring(mouseX, { stiffness: 120, damping: 25, mass: 0.5 })
  const ringY = useSpring(mouseY, { stiffness: 120, damping: 25, mass: 0.5 })

  // Trail positions (increasingly laggy)
  const trails = useRef(
    Array.from({ length: TRAIL_COUNT }, () => ({
      x: useMotionValue(-100),
      y: useMotionValue(-100),
    }))
  ).current

  const trailSprings = useRef(
    trails.map((_, i) => ({
      x: useSpring(trails[i].x, { stiffness: 200 - i * 20, damping: 30 + i * 3, mass: 0.3 + i * 0.08 }),
      y: useSpring(trails[i].y, { stiffness: 200 - i * 20, damping: 30 + i * 3, mass: 0.3 + i * 0.08 }),
    }))
  ).current

  useEffect(() => {
    // Check for mobile/touch
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)

    function onMove(e) {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
      trails.forEach(t => { t.x.set(e.clientX); t.y.set(e.clientY) })
    }

    function onDown() { setClicking(true) }
    function onUp() { setClicking(false) }

    function onEnterWindow() { setHidden(false) }
    function onLeaveWindow() { setHidden(true) }

    // Detect hoverable elements
    function checkHover(e) {
      const el = e.target
      const isLink = el.closest('a, button, [role="button"], input, textarea, select, [data-cursor="pointer"]')
      const isImage = el.closest('img, [data-cursor="image"], figure')
      setHovering(!!isLink)
      setOnImage(!!isImage && !isLink)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mouseover', checkHover, { passive: true })
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    document.addEventListener('mouseleave', onLeaveWindow)
    document.addEventListener('mouseenter', onEnterWindow)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', checkHover)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      document.removeEventListener('mouseleave', onLeaveWindow)
      document.removeEventListener('mouseenter', onEnterWindow)
      window.removeEventListener('resize', checkMobile)
    }
  }, [mouseX, mouseY, trails])

  if (isMobile) return null

  // Ring size based on state
  const ringSize = clicking ? 36 : hovering ? 72 : onImage ? 60 : 48
  const dotSize = clicking ? 5 : hovering ? 0 : 8

  return (
    <>
      {/* Hide default cursor globally */}
      <style>{`
        * { cursor: none !important; }
        a, button, input, textarea, select, [role="button"] { cursor: none !important; }
      `}</style>

      {/* ── Trail particles ── */}
      {trailSprings.map((t, i) => (
        <motion.div
          key={`trail-${i}`}
          style={{
            position: 'fixed',
            left: t.x,
            top: t.y,
            width: `${6 - i * 0.5}px`,
            height: `${6 - i * 0.5}px`,
            borderRadius: '50%',
            backgroundColor: '#ff4d00',
            opacity: hidden ? 0 : (0.5 - i * 0.05),
            pointerEvents: 'none',
            zIndex: 99998,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      {/* ── Outer ring — aperture ── */}
      <motion.div
        style={{
          position: 'fixed',
          left: ringX,
          top: ringY,
          pointerEvents: 'none',
          zIndex: 99999,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <motion.div
          animate={{
            width: ringSize,
            height: ringSize,
            borderColor: hovering ? '#000' : onImage ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)',
            backgroundColor: hovering
              ? 'rgba(0,0,0,0.06)'
              : clicking
                ? 'rgba(255,77,0,0.2)'
                : 'transparent',
            rotate: hovering ? 90 : clicking ? -45 : 0,
            scale: clicking ? 0.7 : 1,
            opacity: hidden ? 0 : 1,
          }}
          transition={{
            width: { type: 'spring', stiffness: 300, damping: 20 },
            height: { type: 'spring', stiffness: 300, damping: 20 },
            rotate: { type: 'spring', stiffness: 200, damping: 15 },
            scale: { type: 'spring', stiffness: 400, damping: 15 },
            backgroundColor: { duration: 0.2 },
            borderColor: { duration: 0.2 },
            opacity: { duration: 0.15 },
          }}
          style={{
            borderRadius: '50%',
            borderWidth: hovering ? '2.5px' : '2px',
            borderStyle: 'solid',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mixBlendMode: hovering ? 'normal' : 'difference',
          }}
        >
          {/* Aperture blades — visible on hover */}
          <AnimatePresence>
            {hovering && (
              <motion.svg
                initial={{ opacity: 0, scale: 0.5, rotate: -60 }}
                animate={{ opacity: 0.6, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.5, rotate: 60 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                width="24" height="24" viewBox="0 0 24 24" fill="none"
                style={{ position: 'absolute' }}
              >
                {/* 6 aperture blade lines */}
                {[0, 60, 120, 180, 240, 300].map(angle => (
                  <line
                    key={angle}
                    x1="12" y1="3" x2="12" y2="9"
                    stroke="#000" strokeWidth="2" strokeLinecap="round"
                    transform={`rotate(${angle} 12 12)`}
                  />
                ))}
              </motion.svg>
            )}
          </AnimatePresence>

          {/* Crosshair — visible on images */}
          <AnimatePresence>
            {onImage && !hovering && (
              <motion.svg
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 0.7, scale: 1 }}
                exit={{ opacity: 0, scale: 0.3 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                width="20" height="20" viewBox="0 0 20 20" fill="none"
                style={{ position: 'absolute' }}
              >
                <line x1="10" y1="2" x2="10" y2="7" stroke="white" strokeWidth="1" />
                <line x1="10" y1="13" x2="10" y2="18" stroke="white" strokeWidth="1" />
                <line x1="2" y1="10" x2="7" y2="10" stroke="white" strokeWidth="1" />
                <line x1="13" y1="10" x2="18" y2="10" stroke="white" strokeWidth="1" />
              </motion.svg>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* ── Inner dot — precise position ── */}
      <motion.div
        style={{
          position: 'fixed',
          left: mouseX,
          top: mouseY,
          pointerEvents: 'none',
          zIndex: 100000,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <motion.div
          animate={{
            width: dotSize,
            height: dotSize,
            opacity: hidden ? 0 : hovering ? 0 : 1,
            backgroundColor: hovering ? '#000' : '#ff4d00',
            scale: clicking ? 3 : 1,
          }}
          transition={{
            scale: { type: 'spring', stiffness: 500, damping: 15 },
            width: { duration: 0.15 },
            opacity: { duration: 0.1 },
          }}
          style={{
            borderRadius: '50%',
          }}
        />
      </motion.div>
    </>
  )
}