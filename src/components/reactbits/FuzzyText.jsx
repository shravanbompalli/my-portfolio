import React, { useEffect, useRef } from 'react'

const FuzzyText = ({
  children,
  fontSize = 'clamp(2rem, 10vw, 10rem)',
  fontWeight = 900,
  fontFamily = 'inherit',
  color = '#fff',
  enableHover = true,
  baseIntensity = 0.18,
  hoverIntensity = 0.5,
  fuzzRange = 30,
  fps = 60,
  className = ''
}) => {
  const canvasRef = useRef(null)

  useEffect(() => {
    let animationFrameId
    let isCancelled = false
    const canvas = canvasRef.current
    if (!canvas) return

    const init = async () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const computedFontFamily = fontFamily === 'inherit' ? window.getComputedStyle(canvas).fontFamily || 'sans-serif' : fontFamily
      const fontSizeStr = typeof fontSize === 'number' ? `${fontSize}px` : fontSize
      const fontString = `${fontWeight} ${fontSizeStr} ${computedFontFamily}`

      try { await document.fonts.load(fontString) } catch { await document.fonts.ready }
      if (isCancelled) return

      let numericFontSize
      if (typeof fontSize === 'number') { numericFontSize = fontSize }
      else {
        const temp = document.createElement('span')
        temp.style.fontSize = fontSize
        document.body.appendChild(temp)
        numericFontSize = parseFloat(window.getComputedStyle(temp).fontSize)
        document.body.removeChild(temp)
      }

      const text = React.Children.toArray(children).join('')
      const offscreen = document.createElement('canvas')
      const offCtx = offscreen.getContext('2d')
      if (!offCtx) return

      offCtx.font = `${fontWeight} ${fontSizeStr} ${computedFontFamily}`
      offCtx.textBaseline = 'alphabetic'
      const metrics = offCtx.measureText(text)
      const actualAscent = metrics.actualBoundingBoxAscent ?? numericFontSize
      const actualDescent = metrics.actualBoundingBoxDescent ?? numericFontSize * 0.2
      const textBoundingWidth = Math.ceil(metrics.width)
      const tightHeight = Math.ceil(actualAscent + actualDescent)

      offscreen.width = textBoundingWidth + 10
      offscreen.height = tightHeight
      offCtx.font = `${fontWeight} ${fontSizeStr} ${computedFontFamily}`
      offCtx.textBaseline = 'alphabetic'
      offCtx.fillStyle = color
      offCtx.fillText(text, 5, actualAscent)

      const hMargin = fuzzRange + 20
      canvas.width = offscreen.width + hMargin * 2
      canvas.height = tightHeight
      ctx.translate(hMargin, 0)

      let isHovering = false
      let currentIntensity = baseIntensity
      let lastFrameTime = 0
      const frameDuration = 1000 / fps

      const run = timestamp => {
        if (isCancelled) return
        if (timestamp - lastFrameTime < frameDuration) { animationFrameId = window.requestAnimationFrame(run); return }
        lastFrameTime = timestamp
        ctx.clearRect(-fuzzRange - 20, 0, offscreen.width + 2 * (fuzzRange + 20), tightHeight)
        currentIntensity = isHovering ? hoverIntensity : baseIntensity
        for (let j = 0; j < tightHeight; j++) {
          const dx = Math.floor(currentIntensity * (Math.random() - 0.5) * fuzzRange)
          ctx.drawImage(offscreen, 0, j, offscreen.width, 1, dx, j, offscreen.width, 1)
        }
        animationFrameId = window.requestAnimationFrame(run)
      }
      animationFrameId = window.requestAnimationFrame(run)

      const handleMouseMove = () => { if (enableHover) isHovering = true }
      const handleMouseLeave = () => { isHovering = false }
      canvas.addEventListener('mousemove', handleMouseMove)
      canvas.addEventListener('mouseleave', handleMouseLeave)

      canvas.cleanupFuzzy = () => {
        canvas.removeEventListener('mousemove', handleMouseMove)
        canvas.removeEventListener('mouseleave', handleMouseLeave)
      }
    }
    init()
    return () => {
      isCancelled = true
      window.cancelAnimationFrame(animationFrameId)
      if (canvas?.cleanupFuzzy) canvas.cleanupFuzzy()
    }
  }, [children, fontSize, fontWeight, fontFamily, color, enableHover, baseIntensity, hoverIntensity, fuzzRange, fps])

  return <canvas ref={canvasRef} className={className} />
}

export default FuzzyText
