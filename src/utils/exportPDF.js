import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import QRCode from 'qrcode'
import { parsePresentation } from './parsePresentation'
import { parseConfig, resolveColor } from './parseConfig'

function seededRand(seed) {
  let s = seed * 9301 + 49297
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

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

function buildHighlightSpan(token, wordIdx, color, spacing) {
  const rng1 = seededRand(wordIdx * 3 + 1)
  const rng2 = seededRand(wordIdx * 3 + 7)

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
  const clipW = 120 + maxSlantX * 2 + 40

  const hex = color.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)

  const path1 = markerPath(seededRand(wordIdx * 3 + 1), slant1Deg, top1, bot1)
  const path2 = markerPath(seededRand(wordIdx * 3 + 7), slant2Deg, top2, bot2)

  const gradId1 = `mg1-${wordIdx}`
  const gradId2 = `mg2-${wordIdx}`

  const svgNS = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(svgNS, 'svg')
  svg.setAttribute('viewBox', '0 0 120 52')
  svg.setAttribute('preserveAspectRatio', 'none')
  svg.style.position = 'absolute'
  svg.style.top = '0'
  svg.style.left = `${-spacing - 10}px`
  svg.style.width = `calc(100% + ${spacing * 2 + 20}px)`
  svg.style.height = '100%'
  svg.style.overflow = 'visible'

  svg.innerHTML = `
    <defs>
      <linearGradient id="${gradId1}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="rgba(${r},${g},${b},0)"/>
        <stop offset="7%" stop-color="rgba(${r},${g},${b},0.55)"/>
        <stop offset="25%" stop-color="rgba(${r},${g},${b},0.70)"/>
        <stop offset="75%" stop-color="rgba(${r},${g},${b},0.70)"/>
        <stop offset="93%" stop-color="rgba(${r},${g},${b},0.50)"/>
        <stop offset="100%" stop-color="rgba(${r},${g},${b},0)"/>
      </linearGradient>
      <linearGradient id="${gradId2}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="rgba(${r},${g},${b},0)"/>
        <stop offset="9%" stop-color="rgba(${r},${g},${b},0.45)"/>
        <stop offset="30%" stop-color="rgba(${r},${g},${b},0.60)"/>
        <stop offset="70%" stop-color="rgba(${r},${g},${b},0.60)"/>
        <stop offset="91%" stop-color="rgba(${r},${g},${b},0.42)"/>
        <stop offset="100%" stop-color="rgba(${r},${g},${b},0)"/>
      </linearGradient>
    </defs>
    <path d="${path1}" fill="url(#${gradId1})"/>
    <path d="${path2}" fill="url(#${gradId2})"/>
  `

  const wrapper = document.createElement('span')
  wrapper.style.position = 'relative'
  wrapper.style.display = 'inline-block'
  wrapper.appendChild(svg)

  const textSpan = document.createElement('span')
  textSpan.style.position = 'relative'
  if (token.bold) {
    textSpan.style.fontFamily = '"SF Pro Display", -apple-system, sans-serif'
    textSpan.style.fontWeight = '900'
  }
  textSpan.textContent = token.text
  wrapper.appendChild(textSpan)
  return wrapper
}

// Inline parseContent from TextSlide — same logic, no React dependency
function parseContent(content) {
  const boldSegments = []
  const boldRe = /\*\*([\s\S]+?)\*\*/g
  let last = 0, m
  while ((m = boldRe.exec(content)) !== null) {
    if (m.index > last) boldSegments.push({ text: content.slice(last, m.index), bold: false })
    boldSegments.push({ text: m[1], bold: true })
    last = boldRe.lastIndex
  }
  if (last < content.length) boldSegments.push({ text: content.slice(last), bold: false })

  const segments = []
  const hlRe = /==([\s\S]+?)(?:\|([^=]+))?==/g
  for (const seg of boldSegments) {
    hlRe.lastIndex = 0
    let hlLast = 0, hm
    while ((hm = hlRe.exec(seg.text)) !== null) {
      if (hm.index > hlLast) segments.push({ text: seg.text.slice(hlLast, hm.index), bold: seg.bold })
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

/**
 * Export a presentation as PDF (one slide per page, 16:9 aspect ratio)
 * @param {Object} presentation - Presentation object with content, path, name
 * @param {Function} onProgress - Progress callback (current, total)
 * @returns {Promise<void>}
 */
export async function exportPresentationAsPDF(presentation, onProgress) {
  const allSlides = parsePresentation(presentation.content, presentation.path)

  if (allSlides.length === 0) {
    throw new Error('No slides found in presentation')
  }

  // Filter out continuation slides — keep only the last slide in each build-up chain
  const slides = allSlides.filter((slide, i) => {
    const next = allSlides[i + 1]
    if (
      slide.type === 'text' &&
      next?.type === 'text' &&
      next.content?.trimStart().startsWith(slide.content?.trim())
    ) return false
    return true
  })

  // Create PDF with 16:9 landscape orientation
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [297, 167]
  })

  // Create hidden container for rendering
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.top = '-10000px'
  container.style.left = '-10000px'
  container.style.width = '1600px'
  container.style.height = '900px'
  container.style.overflow = 'hidden'
  container.style.zIndex = '-9999'
  document.body.appendChild(container)

  try {
    // Render all slides
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i]

      if (onProgress) {
        onProgress(i + 1, slides.length + 1) // +1 for QR code page
      }

      // Add new page for slides after the first
      if (i > 0) {
        pdf.addPage()
      }

      // Render slide
      await renderSlideToDOM(container, slide)

      // Wait for content to be ready
      await waitForSlideReady(container, slide)

      // Capture slide with html2canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: slide.background || '#ffffff',
        logging: false,
        width: 1600,
        height: 900
      })

      // Add canvas to PDF
      const imgData = canvas.toDataURL('image/png')
      pdf.addImage(imgData, 'PNG', 0, 0, 297, 167)

      // Clean up for next slide
      container.innerHTML = ''
    }

    // Add QR Code page
    if (onProgress) {
      onProgress(slides.length + 1, slides.length + 1)
    }

    pdf.addPage()
    await renderQRCodePage(container)
    await new Promise(resolve => setTimeout(resolve, 300))

    const qrCanvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: 1600,
      height: 900
    })

    const qrImgData = qrCanvas.toDataURL('image/png')
    pdf.addImage(qrImgData, 'PNG', 0, 0, 297, 167)

    // Save PDF
    const filename = `${presentation.name.replace(/[^a-z0-9]/gi, '_')}.pdf`
    pdf.save(filename)

  } finally {
    // Clean up container
    document.body.removeChild(container)
  }
}

/**
 * Render a slide to DOM
 */
async function renderSlideToDOM(container, slide) {
  container.innerHTML = ''

  const slideDiv = document.createElement('div')
  slideDiv.style.width = '1600px'
  slideDiv.style.height = '900px'
  slideDiv.style.backgroundColor = slide.background || '#ffffff'
  slideDiv.style.position = 'relative'
  slideDiv.style.overflow = 'hidden'

  if (slide.type === 'text') {
    slideDiv.style.display = 'flex'
    slideDiv.style.alignItems = 'center'
    slideDiv.style.justifyContent = 'center'

    const config = parseConfig(null) // use defaults; config.md not available in export context
    const { colors, highlight: hlConfig, text: textConfig } = config
    const defaultHlColor = resolveColor(hlConfig['default-color'], colors)
    const defaultTextColor = textConfig['default-color'] || colors['text'] || '#1a1612'
    const textColor = slide.color && slide.color !== '#000000' ? slide.color : defaultTextColor

    const isDisplay = slide.font === 'display'
    const fontFamily = isDisplay
      ? '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif'
      : '"Courier Prime", "Courier New", monospace'

    const textDiv = document.createElement('div')
    textDiv.style.fontSize = '6rem'
    textDiv.style.fontWeight = '400'
    textDiv.style.fontFamily = fontFamily
    textDiv.style.color = textColor
    textDiv.style.textAlign = 'center'
    textDiv.style.padding = '2rem 12rem'
    textDiv.style.lineHeight = '1.2'
    textDiv.style.maxWidth = '1600px'
    textDiv.style.width = '1600px'
    textDiv.style.boxSizing = 'border-box'
    textDiv.style.wordBreak = 'break-word'
    textDiv.style.overflowWrap = 'break-word'

    const lines = parseContent(slide.content || '')
    let wordIdx = 0
    lines.forEach((lineTokens) => {
      const lineDiv = document.createElement('div')
      lineTokens.forEach(token => {
        if (token.highlight) {
          const hlColor = resolveColor(token.colorName, colors) || defaultHlColor
          const spacing = hlConfig['spacing-min'] + 2
          // Split phrase into individual words — each gets its own marker so multi-line wrapping works
          const words = token.text.split(' ').filter(w => w)
          words.forEach((word, wi) => {
            const el = buildHighlightSpan({ ...token, text: word }, wordIdx + wi, hlColor, spacing)
            el.style.display = 'inline-block'
            el.style.marginRight = '0.3em'
            lineDiv.appendChild(el)
          })
          wordIdx += Math.max(words.length, 1)
        } else {
          const span = document.createElement('span')
          span.style.display = 'inline-block'
          span.style.marginRight = '0.3em'
          if (token.bold) {
            span.style.fontFamily = '"SF Pro Display", -apple-system, sans-serif'
            span.style.fontWeight = '900'
          }
          span.textContent = token.text
          lineDiv.appendChild(span)
          wordIdx++
        }
      })
      textDiv.appendChild(lineDiv)
    })

    slideDiv.appendChild(textDiv)

  } else if (slide.type === 'image' && slide.src) {
    // Load image first to get natural dimensions
    const img = await loadImageElement(slide.src)

    const fit = slide.fit || 'fullscreen'

    if (fit === 'fullscreen') {
      // Create canvas with slide dimensions
      const canvas = document.createElement('canvas')
      canvas.width = 1600
      canvas.height = 900
      const ctx = canvas.getContext('2d')

      // Fill background
      ctx.fillStyle = slide.background || '#000000'
      ctx.fillRect(0, 0, 1600, 900)

      // Calculate dimensions to cover the entire canvas while maintaining aspect ratio
      const imgRatio = img.naturalWidth / img.naturalHeight
      const canvasRatio = 1600 / 900

      let drawWidth, drawHeight, offsetX, offsetY

      if (imgRatio > canvasRatio) {
        // Image is wider - fit to height
        drawHeight = 900
        drawWidth = drawHeight * imgRatio
        offsetX = -(drawWidth - 1600) / 2
        offsetY = 0
      } else {
        // Image is taller - fit to width
        drawWidth = 1600
        drawHeight = drawWidth / imgRatio
        offsetX = 0
        offsetY = -(drawHeight - 900) / 2
      }

      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)
      slideDiv.appendChild(canvas)

    } else if (fit === 'inset') {
      slideDiv.style.display = 'flex'
      slideDiv.style.alignItems = 'center'
      slideDiv.style.justifyContent = 'center'

      const displayImg = document.createElement('img')
      displayImg.src = img.src
      displayImg.style.maxWidth = '90%'
      displayImg.style.maxHeight = '90%'
      displayImg.style.width = 'auto'
      displayImg.style.height = 'auto'
      displayImg.style.objectFit = 'contain'
      displayImg.style.display = 'block'

      slideDiv.appendChild(displayImg)

    } else if (fit === 'positioned') {
      slideDiv.style.display = 'flex'
      slideDiv.style.alignItems = 'center'
      slideDiv.style.justifyContent = 'center'

      // Use original image dimensions, but scale down if too large
      const maxWidth = 1600 * 0.9  // 90% of slide width
      const maxHeight = 900 * 0.9  // 90% of slide height

      let displayWidth = img.naturalWidth
      let displayHeight = img.naturalHeight

      // Scale down if larger than max dimensions, maintaining aspect ratio
      if (displayWidth > maxWidth || displayHeight > maxHeight) {
        const scale = Math.min(maxWidth / displayWidth, maxHeight / displayHeight)
        displayWidth = displayWidth * scale
        displayHeight = displayHeight * scale
      }

      const displayImg = document.createElement('img')
      displayImg.src = img.src
      displayImg.style.width = `${displayWidth}px`
      displayImg.style.height = `${displayHeight}px`
      displayImg.style.display = 'block'

      slideDiv.appendChild(displayImg)
    }

  } else if (slide.type === 'video' && slide.src) {
    // Render video as screenshot from middle of video
    const video = document.createElement('video')
    video.src = slide.src
    video.crossOrigin = 'anonymous'
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true

    // Wait for video metadata to load
    await new Promise((resolve) => {
      video.onloadedmetadata = () => {
        video.currentTime = video.duration / 2
      }
      video.onseeked = resolve
      video.onerror = resolve
      setTimeout(resolve, 3000)
    })

    const fit = slide.fit || 'fullscreen'

    if (fit === 'fullscreen') {
      // Create canvas with slide dimensions for fullscreen
      const canvas = document.createElement('canvas')
      canvas.width = 1600
      canvas.height = 900
      const ctx = canvas.getContext('2d')

      // Fill background
      ctx.fillStyle = slide.background || '#000000'
      ctx.fillRect(0, 0, 1600, 900)

      // Calculate dimensions to cover the entire canvas while maintaining aspect ratio
      const videoRatio = video.videoWidth / video.videoHeight
      const canvasRatio = 1600 / 900

      let drawWidth, drawHeight, offsetX, offsetY

      if (videoRatio > canvasRatio) {
        // Video is wider - fit to height
        drawHeight = 900
        drawWidth = drawHeight * videoRatio
        offsetX = -(drawWidth - 1600) / 2
        offsetY = 0
      } else {
        // Video is taller - fit to width
        drawWidth = 1600
        drawHeight = drawWidth / videoRatio
        offsetX = 0
        offsetY = -(drawHeight - 900) / 2
      }

      ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight)
      slideDiv.appendChild(canvas)

    } else {
      // For inset and positioned, use centered image approach
      slideDiv.style.display = 'flex'
      slideDiv.style.alignItems = 'center'
      slideDiv.style.justifyContent = 'center'

      // Capture video frame to canvas at original size
      const captureCanvas = document.createElement('canvas')
      captureCanvas.width = video.videoWidth || 1920
      captureCanvas.height = video.videoHeight || 1080
      const captureCtx = captureCanvas.getContext('2d')
      captureCtx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height)

      // Create img from canvas
      const img = document.createElement('img')
      img.src = captureCanvas.toDataURL('image/png')

      if (fit === 'inset') {
        img.style.maxWidth = '90%'
        img.style.maxHeight = '90%'
        img.style.width = 'auto'
        img.style.height = 'auto'
        img.style.objectFit = 'contain'
        img.style.display = 'block'
      } else if (fit === 'positioned') {
        // Use original video dimensions, but scale down if too large
        const maxWidth = 1600 * 0.9  // 90% of slide width
        const maxHeight = 900 * 0.9  // 90% of slide height

        let displayWidth = video.videoWidth
        let displayHeight = video.videoHeight

        // Scale down if larger than max dimensions, maintaining aspect ratio
        if (displayWidth > maxWidth || displayHeight > maxHeight) {
          const scale = Math.min(maxWidth / displayWidth, maxHeight / displayHeight)
          displayWidth = displayWidth * scale
          displayHeight = displayHeight * scale
        }

        img.style.width = `${displayWidth}px`
        img.style.height = `${displayHeight}px`
        img.style.display = 'block'
      }

      slideDiv.appendChild(img)
    }
  }

  container.appendChild(slideDiv)
}

/**
 * Load an image element
 */
function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Render QR code page
 */
async function renderQRCodePage(container) {
  container.innerHTML = ''

  const pageDiv = document.createElement('div')
  pageDiv.style.width = '1600px'
  pageDiv.style.height = '900px'
  pageDiv.style.backgroundColor = '#ffffff'
  pageDiv.style.position = 'relative'
  pageDiv.style.display = 'flex'
  pageDiv.style.flexDirection = 'column'
  pageDiv.style.alignItems = 'center'
  pageDiv.style.justifyContent = 'center'
  pageDiv.style.gap = '2rem'

  // Generate QR Code
  const qrCanvas = document.createElement('canvas')
  await QRCode.toCanvas(qrCanvas, 'https://www.antighost.de', {
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  })

  pageDiv.appendChild(qrCanvas)

  // Text below QR code
  const textDiv = document.createElement('div')
  textDiv.style.fontSize = '1.5rem'
  textDiv.style.color = '#666666'
  textDiv.style.fontFamily = '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  textDiv.textContent = 'Scan to view presentation'

  pageDiv.appendChild(textDiv)
  container.appendChild(pageDiv)
}

/**
 * Wait for slide to be ready
 */
async function waitForSlideReady(container, slide) {
  if (slide.type === 'image' && slide.src) {
    // Wait for images to load
    const images = container.getElementsByTagName('img')
    if (images.length > 0) {
      const imagePromises = Array.from(images).map(img => {
        return new Promise((resolve) => {
          if (img.complete && img.naturalHeight !== 0) {
            resolve()
          } else {
            img.onload = resolve
            img.onerror = resolve
            setTimeout(resolve, 3000)
          }
        })
      })
      await Promise.all(imagePromises)
    }
  }

  // Small delay to ensure rendering is complete
  await new Promise(resolve => setTimeout(resolve, 300))
}




