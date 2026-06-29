import { useRef, useEffect, useLayoutEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getAnimation } from '../../animations'
import { useConfig } from '../../context/ConfigContext'
import { resolveColor } from '../../utils/parseConfig'

// Seeded random — deterministic per word position so shape is stable across renders
function seededRand(seed) {
  let s = seed * 9301 + 49297
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

// Build a smooth wavy parallelogram path using multiple sampled edge points
function markerPath(rng, slantDeg, top, bottom) {
  const j = (s = 1) => (rng() - 0.5) * 2 * s
  const slantX = (bottom - top) * Math.tan((slantDeg * Math.PI) / 180)
  const steps = 6
  const topPts = [], botPts = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    topPts.push({ x: t * 120 + slantX * (1 - t) + j(1.5), y: top + j(1.8) })
    botPts.push({ x: t * 120 + j(1.2), y: bottom + j(1.8) })
  }
  const smoothEdge = (pts) => {
    let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i], p1 = pts[i + 1]
      const cx = (p0.x + p1.x) / 2
      d += ` C${cx.toFixed(1)},${p0.y.toFixed(1)} ${cx.toFixed(1)},${p1.y.toFixed(1)} ${p1.x.toFixed(1)},${p1.y.toFixed(1)}`
    }
    return d
  }
  const botRev = [...botPts].reverse()
  return `${smoothEdge(topPts)} L${botPts[steps].x.toFixed(1)},${botPts[steps].y.toFixed(1)} ${smoothEdge(botRev).slice(1)} Z`
}

function AnimatedClipRect({ x, clipW, delay, duration }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.width = '0px'
    const id = requestAnimationFrame(() => {
      el.style.transition = `width ${duration}s ease-out ${delay}s`
      el.style.width = `${clipW}px`
    })
    return () => cancelAnimationFrame(id)
  }, [])

  return <rect ref={ref} x={x} y="-10" height="72" />
}

function MarkerHighlight({ children, color, spacingMin, spacingMax, wordIdx, animDelay }) {
  const textRef = useRef(null)
  const [lineRects, setLineRects] = useState([])

  useLayoutEffect(() => {
    const measure = () => {
      if (!textRef.current) return
      const el = textRef.current
      const parentRect = el.closest('span[data-marker-root]').getBoundingClientRect()
      const rects = Array.from(el.getClientRects())
      if (rects.length === 0) return
      setLineRects(rects.map(r => ({
        left: r.left - parentRect.left,
        top: r.top - parentRect.top,
        width: r.width,
        height: r.height,
      })))
    }

    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [children])

  const hex = color.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)

  return (
    <span data-marker-root="" style={{ position: 'relative', display: 'inline', whiteSpace: 'normal' }}>
      {lineRects.map((rect, li) => {
        const rng1 = seededRand((wordIdx * 10 + li) * 3 + 1)
        const rng2 = seededRand((wordIdx * 10 + li) * 3 + 7)
        const spacing = spacingMin + rng1() * (spacingMax - spacingMin)
        const bandTop = 10 + (rng1() - 0.5) * 3
        const bandH = 32 + (rng1() - 0.5) * 2
        const slant1Deg = Math.pow(rng1(), 2) * 12 + 1
        const slant2Deg = Math.pow(rng2(), 2) * 14 + 3
        const top1 = bandTop + (rng1() - 0.5) * 1.5
        const bot1 = top1 + bandH + (rng1() - 0.5) * 1
        const top2 = bandTop - 1 + (rng2() - 0.5) * 1.5
        const bot2 = top2 + bandH - 1 + (rng2() - 0.5) * 1
        const maxSlantX = Math.max(
          bandH * Math.tan((slant1Deg * Math.PI) / 180),
          bandH * Math.tan((slant2Deg * Math.PI) / 180)
        )
        const clipX = -maxSlantX - 20
        const clipW = 120 + maxSlantX * 2 + 40
        const lineDelay = animDelay < 0 ? -1 : animDelay + li * 0.12
        const gradId1 = `mg1-${wordIdx}-${li}`
        const gradId2 = `mg2-${wordIdx}-${li}`
        const filt1 = `mf1-${wordIdx}-${li}`
        const filt2 = `mf2-${wordIdx}-${li}`
        const clip1 = `mc1-${wordIdx}-${li}`
        const clip2 = `mc2-${wordIdx}-${li}`
        const path1 = markerPath(seededRand((wordIdx * 10 + li) * 3 + 1), slant1Deg, top1, bot1)
        const path2 = markerPath(seededRand((wordIdx * 10 + li) * 3 + 7), slant2Deg, top2, bot2)

        return (
          <svg
            key={li}
            style={{
              position: 'absolute',
              left: rect.left - spacing - 10,
              top: rect.top,
              width: rect.width + spacing * 2 + 20,
              height: rect.height,
              overflow: 'visible',
              pointerEvents: 'none',
            }}
            viewBox="0 0 120 52"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id={gradId1} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={`rgba(${r},${g},${b},0)`} />
                <stop offset="7%" stopColor={`rgba(${r},${g},${b},0.55)`} />
                <stop offset="25%" stopColor={`rgba(${r},${g},${b},0.70)`} />
                <stop offset="75%" stopColor={`rgba(${r},${g},${b},0.70)`} />
                <stop offset="93%" stopColor={`rgba(${r},${g},${b},0.50)`} />
                <stop offset="100%" stopColor={`rgba(${r},${g},${b},0)`} />
              </linearGradient>
              <linearGradient id={gradId2} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={`rgba(${r},${g},${b},0)`} />
                <stop offset="9%" stopColor={`rgba(${r},${g},${b},0.45)`} />
                <stop offset="30%" stopColor={`rgba(${r},${g},${b},0.60)`} />
                <stop offset="70%" stopColor={`rgba(${r},${g},${b},0.60)`} />
                <stop offset="91%" stopColor={`rgba(${r},${g},${b},0.42)`} />
                <stop offset="100%" stopColor={`rgba(${r},${g},${b},0)`} />
              </linearGradient>
              <filter id={filt1} x="-8%" y="-40%" width="116%" height="180%">
                <feTurbulence type="turbulence" baseFrequency="0.018 0.04" numOctaves="4" seed={wordIdx * 10 + li + 3} result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" result="displaced" />
                <feGaussianBlur in="displaced" stdDeviation="0.4 0.2" />
              </filter>
              <filter id={filt2} x="-8%" y="-40%" width="116%" height="180%">
                <feTurbulence type="turbulence" baseFrequency="0.022 0.05" numOctaves="3" seed={wordIdx * 10 + li + 9} result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="G" yChannelSelector="R" result="displaced" />
                <feGaussianBlur in="displaced" stdDeviation="0.3 0.15" />
              </filter>
              <clipPath id={clip1}>
                {lineDelay < 0
                  ? <rect x={clipX} y="-10" height="72" width={clipW} />
                  : <AnimatedClipRect x={clipX} clipW={clipW} delay={lineDelay} duration={0.55} />}
              </clipPath>
              <clipPath id={clip2}>
                {lineDelay < 0
                  ? <rect x={clipX} y="-10" height="72" width={clipW} />
                  : <AnimatedClipRect x={clipX} clipW={clipW} delay={lineDelay + 0.08} duration={0.50} />}
              </clipPath>
            </defs>
            <g clipPath={`url(#${clip1})`} filter={`url(#${filt1})`}>
              <path d={path1} fill={`url(#${gradId1})`} />
            </g>
            <g clipPath={`url(#${clip2})`} filter={`url(#${filt2})`}>
              <path d={path2} fill={`url(#${gradId2})`} />
            </g>
          </svg>
        )
      })}
      <span ref={textRef} style={{ position: 'relative' }}>{children}</span>
    </span>
  )
}

// Parse full content into lines of word tokens.
// Pass 1: split on **...** (bold, spans newlines) → segments with bold flag
// Pass 2: within each segment, split on ==text== / ==text|color== → highlight flag
// Tokens can combine both: **==word==** → { bold: true, highlight: true }
function parseContent(content) {
  // Pass 1: bold spans
  const boldSegments = []
  const boldRe = /\*\*([\s\S]+?)\*\*/g
  let last = 0, m
  while ((m = boldRe.exec(content)) !== null) {
    if (m.index > last) boldSegments.push({ text: content.slice(last, m.index), bold: false })
    boldSegments.push({ text: m[1], bold: true })
    last = boldRe.lastIndex
  }
  if (last < content.length) boldSegments.push({ text: content.slice(last), bold: false })

  // Pass 2: highlight spans within each bold segment
  const segments = []
  const hlRe = /==([\s\S]+?)(?:\|([^=]+))?==/g
  for (const seg of boldSegments) {
    hlRe.lastIndex = 0
    let hlLast = 0, hm
    while ((hm = hlRe.exec(seg.text)) !== null) {
      if (hm.index > hlLast) segments.push({ text: seg.text.slice(hlLast, hm.index), bold: seg.bold })
      // each line inside == becomes one highlight token (whole phrase, one marker)
      const colorName = hm[2] || null
      hm[1].split('\n').forEach((line, li) => {
        if (li > 0) segments.push({ lineBreak: true })
        const phrase = line.trim()
        if (phrase) segments.push({ text: phrase, highlight: true, colorName, bold: seg.bold })
      })
      hlLast = hlRe.lastIndex
    }
    if (hlLast < seg.text.length) segments.push({ text: seg.text.slice(hlLast), bold: seg.bold })
  }

  // Split into lines and words
  const lines = [[]]
  for (const seg of segments) {
    if (seg.lineBreak) {
      lines.push([])
    } else if (seg.highlight) {
      lines[lines.length - 1].push(seg)
    } else {
      seg.text.split('\n').forEach((part, pi) => {
        if (pi > 0) lines.push([])
        part.split(' ').forEach(w => { if (w) lines[lines.length - 1].push({ text: w, bold: seg.bold }) })
      })
    }
  }
  return lines
}

function TextSlide({ content, previousContent = null, color = '#000000', background = '#ffffff', animation = 'cascade-up', font, instantExit = false }) {
  const config = useConfig()
  const { colors, highlight, text: textConfig } = config
  const spacingMin = highlight['spacing-min']
  const spacingMax = highlight['spacing-max']
  const rotationMax = textConfig['rotation-max']
  const organicRotation = textConfig['organic-rotation']
  const defaultHighlightColor = resolveColor(highlight['default-color'], colors)

  // Typewriter is the default; per-slide font prop can override to 'display'
  const baseFontFamily = font === 'display'
    ? "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
    : "'Typewriter', monospace"

  // Use configured text color as default if slide doesn't specify one
  const resolvedColor = color !== '#000000' ? color : (textConfig['default-color'] || colors['text'] || color)

  // For continuation slides: all lines render immediately so centering accounts for all lines.
  // We then animate the text block from the old centered position (offset down by half the new-lines height)
  // to the final position (offset = 0) so the frozen text appears to slide up smoothly.
  const allLines = content && typeof content === 'string' ? parseContent(content) : []
  const frozenLineCount = previousContent ? parseContent(previousContent).length : 0
  const newLineCount = allLines.length - frozenLineCount

  // Compute the Y offset in px: font-size 6rem × line-height 1.2 per line, shifted up by newLines/2
  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize)
  const slideUpInitialY = previousContent
    ? (newLineCount * 6 * 1.2 * rootFontSize) / 2
    : 0

  if (!content || typeof content !== 'string') {
    return (
      <motion.div
        className="slide"
        style={{ backgroundColor: background }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="slide-text" style={{ color: resolvedColor, fontFamily: baseFontFamily }} />
      </motion.div>
    )
  }

  const lines = allLines
  const animConfig = getAnimation('text', animation)

  let wordIndex = 0

  const linesContent = lines.map((lineTokens, lineIndex) => {
    const frozen = lineIndex < frozenLineCount

    return (
      <div key={lineIndex}>
        {lineTokens.map((token) => {
          const idx = wordIndex++
          const rng = seededRand(idx + 42)
          const rotation = organicRotation ? (rng() - 0.5) * 2 * rotationMax : 0
          const translateY = organicRotation ? (rng() - 0.5) * 3 : 0

          // Highlight tokens must flow inline (no inline-block wrapper) so the text wraps
          // naturally across lines — getClientRects() then gives one rect per visual line.
          if (token.highlight) {
            const child = token.bold
              ? <span style={{ fontFamily: "'SF Pro Display', -apple-system, sans-serif", fontWeight: 900 }}>{token.text}</span>
              : token.text
            if (frozen) {
              return (
                <MarkerHighlight
                  key={idx}
                  color={resolveColor(token.colorName, colors) || defaultHighlightColor}
                  spacingMin={spacingMin}
                  spacingMax={spacingMax}
                  wordIdx={idx}
                  animDelay={-1}
                >
                  {child}
                </MarkerHighlight>
              )
            }
            return (
              <motion.span
                key={idx}
                style={{ display: 'inline', marginRight: '0.3em' }}
                initial={{ opacity: 0, y: animConfig.initialY }}
                animate={{ opacity: 1, y: animConfig.finalY }}
                transition={{
                  opacity: { duration: animConfig.opacityDuration, ease: 'easeOut', delay: idx * animConfig.staggerDelay },
                  y: { duration: animConfig.movementDuration, ease: animConfig.ease, delay: idx * animConfig.staggerDelay }
                }}
              >
                <MarkerHighlight
                  color={resolveColor(token.colorName, colors) || defaultHighlightColor}
                  spacingMin={spacingMin}
                  spacingMax={spacingMax}
                  wordIdx={idx}
                  animDelay={idx * animConfig.staggerDelay}
                >
                  {child}
                </MarkerHighlight>
              </motion.span>
            )
          }

          const tokenContent = token.bold
            ? <span style={{ fontFamily: "'SF Pro Display', -apple-system, sans-serif", fontWeight: 900 }}>{token.text}</span>
            : token.text

          const sharedStyle = {
            display: 'inline-block',
            marginRight: '0.3em',
            transform: `rotate(${rotation.toFixed(2)}deg) translateY(${translateY.toFixed(1)}px)`,
          }

          if (frozen) {
            return <span key={idx} style={sharedStyle}>{tokenContent}</span>
          }

          return (
            <motion.span
              key={idx}
              style={sharedStyle}
              initial={{ opacity: 0, y: animConfig.initialY }}
              animate={{ opacity: 1, y: animConfig.finalY }}
              transition={{
                opacity: { duration: animConfig.opacityDuration, ease: 'easeOut', delay: idx * animConfig.staggerDelay },
                y: { duration: animConfig.movementDuration, ease: animConfig.ease, delay: idx * animConfig.staggerDelay }
              }}
            >
              {tokenContent}
            </motion.span>
          )
        })}
      </div>
    )
  })

  const innerText = previousContent ? (
    <motion.div
      className="slide-text"
      style={{ color: resolvedColor, fontFamily: baseFontFamily }}
      initial={{ y: slideUpInitialY }}
      animate={{ y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {linesContent}
    </motion.div>
  ) : (
    <div className="slide-text" style={{ color: resolvedColor, fontFamily: baseFontFamily }}>
      {linesContent}
    </div>
  )

  if (previousContent) {
    return (
      <motion.div
        className="slide"
        style={{ backgroundColor: background }}
        initial={false}
        exit={{ opacity: 0, filter: 'blur(20px)' }}
        transition={{
          opacity: { duration: 0.3 },
          filter: { duration: 0.4, ease: 'easeInOut' }
        }}
      >
        {innerText}
      </motion.div>
    )
  }

  return (
    <motion.div
      className="slide"
      style={{ backgroundColor: background }}
      initial={{ opacity: 0, filter: 'blur(20px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      exit={instantExit ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(20px)' }}
      transition={{
        opacity: { duration: instantExit ? 0 : 0.3 },
        filter: { duration: instantExit ? 0 : 0.4, ease: 'easeInOut' }
      }}
    >
      {innerText}
    </motion.div>
  )
}

export default TextSlide
