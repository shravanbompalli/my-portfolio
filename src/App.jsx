import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import CustomCursor from './components/CustomCursor'
import LoadingAnimation from './components/LoadingAnimation'
import Home from './pages/Home'
import PortfolioPage from './pages/PortfolioPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import AboutPage from './pages/AboutPage'
import MyShotsPage from './pages/MyShotsPage'
import ContactPage from './pages/ContactPage'
import AdminPanel from './pages/AdminPanel'

/*
  Framer Page Transition — 5-block curtain effect:
  1. User clicks a link → 5 black blocks expand UP from bottom (staggered, center-out)
  2. Blocks fully cover the screen
  3. Route changes, scroll resets
  4. Blocks collapse DOWN (staggered, center-out) to reveal new page
  
  This matches the Framer template's loading screen behavior
  but repurposed as a route transition.
*/

/* The 5-block transition overlay */
function TransitionCurtain({ phase }) {
  // phase: 'idle' | 'covering' | 'covered' | 'revealing'
  const isActive = phase !== 'idle'

  // Stagger: center block first, then outward
  // Block order: [1, 2, 3, 4, 5] → delays: [120, 60, 0, 60, 120]
  const staggerDelays = [200, 100, 0, 100, 200]

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99998,
        pointerEvents: isActive ? 'all' : 'none',
        // Keep it in DOM but invisible when idle
        visibility: isActive ? 'visible' : 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '-1px',
          right: '-1px',
          bottom: 0,
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        {[0, 1, 2, 3, 4].map(i => {
          let height = '0%'
          let origin = 'bottom center'
          let transition = 'none'

          if (phase === 'covering') {
            height = '100%'
            origin = 'bottom center'
            transition = `height 0.8s cubic-bezier(0.7, 0, 0.3, 1) ${staggerDelays[i]}ms`
          } else if (phase === 'covered') {
            height = '100%'
            origin = 'top center'
            transition = 'none'
          } else if (phase === 'revealing') {
            height = '0%'
            origin = 'top center'
            transition = `height 0.8s cubic-bezier(0.7, 0, 0.3, 1) ${staggerDelays[i]}ms`
          }

          return (
            <div
              key={i}
              style={{
                width: '20%',
                height,
                backgroundColor: '#000',
                position: 'relative',
                transformOrigin: origin,
                transition,
                // Blocks grow from bottom when covering, shrink from top when revealing
                alignSelf: (phase === 'revealing' || phase === 'idle') ? 'flex-start' : 'flex-end',
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

function PageTransitions() {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)
  const [phase, setPhase] = useState('idle')
  const prevPath = useRef(location.pathname)
  const timeoutRefs = useRef([])

  // Clean up timeouts on unmount
  const clearAllTimeouts = () => {
    timeoutRefs.current.forEach(t => clearTimeout(t))
    timeoutRefs.current = []
  }

  const addTimeout = (fn, ms) => {
    const t = setTimeout(fn, ms)
    timeoutRefs.current.push(t)
    return t
  }

  useEffect(() => {
    if (location.pathname === displayLocation.pathname) return

    clearAllTimeouts()

    // Phase 1: Blocks expand to cover screen (bottom → up)
    setPhase('covering')

    // Phase 2: After blocks fully cover, swap the route
    addTimeout(() => {
      setPhase('covered')
      prevPath.current = displayLocation.pathname
      setDisplayLocation(location)
      window.scrollTo({ top: 0, behavior: 'instant' })

              // Phase 3: Small pause while covered, then reveal
      addTimeout(() => {
        setPhase('revealing')

        // Phase 4: After reveal completes, go idle
        addTimeout(() => {
          setPhase('idle')
        }, 1100) // reveal duration + stagger
      }, 300) // brief hold while covered
    }, 1000) // cover duration + stagger

    return clearAllTimeouts
  }, [location])

  return (
    <>
      {/* Orange progress bar — now just a thin accent line during transition */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '3px',
        zIndex: 99999,
        backgroundColor: '#ff4d00',
        width: phase === 'idle' ? '0%' : phase === 'covering' ? '30%' : phase === 'covered' ? '70%' : '100%',
        transition: phase === 'idle' ? 'width 0.3s ease, opacity 0.3s ease'
          : 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: phase === 'idle' ? 0 : 1,
        boxShadow: '0 0 10px rgba(255, 77, 0, 0.5)',
      }} />

      {/* 5-block curtain overlay */}
      <TransitionCurtain phase={phase} />

      {/* Page content — subtle fade for extra smoothness */}
      <div style={{
        opacity: phase === 'covered' ? 0.001 : 1,
        transition: phase === 'covered' ? 'none' : 'opacity 0.3s ease',
      }}>
        <Routes location={displayLocation}>
          <Route path="/" element={<Home />} />
          <Route path="/portfolio/:slug" element={<ProjectDetailPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/my-shots" element={<MyShotsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </div>
    </>
  )
}

export default function App() {
  const [showLoading, setShowLoading] = useState(true)

  useEffect(() => {
    if (showLoading) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [showLoading])

  return (
    <>
      {showLoading && (
        <LoadingAnimation onComplete={() => setShowLoading(false)} />
      )}

      <BrowserRouter>
        <CustomCursor />
        <PageTransitions />
      </BrowserRouter>
    </>
  )
}