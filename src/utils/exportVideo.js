import { parsePresentation } from './parsePresentation'
import html2canvas from 'html2canvas'

/**
 * Record a presentation as video using MediaRecorder API
 * @param {Object} presentation - Presentation object with content, path, name
 * @param {Object} options - Recording options
 * @param {Function} onProgress - Progress callback (current, total)
 * @returns {Promise<void>}
 */
export async function recordPresentationAsVideo(presentation, options = {}, onProgress) {
  const {
    fps = 30,
    slideDelay = 3000,
    videoBitrate = 2500000
  } = options

  const slides = parsePresentation(presentation.content, presentation.path)

  if (slides.length === 0) {
    throw new Error('No slides found in presentation')
  }

  // Check MediaRecorder support
  if (!window.MediaRecorder) {
    throw new Error('MediaRecorder API not supported in this browser')
  }

  // Determine best MIME type
  const mimeTypes = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm'
  ]

  const mimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type))

  if (!mimeType) {
    throw new Error('No supported video format found')
  }

  // Create canvas for recording
  const canvas = document.createElement('canvas')
  canvas.width = 1920
  canvas.height = 1080
  const ctx = canvas.getContext('2d')

  // Create hidden container for rendering
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.top = '-10000px'
  container.style.left = '-10000px'
  container.style.width = '1920px'
  container.style.height = '1080px'
  container.style.overflow = 'hidden'
  container.style.zIndex = '-9999'
  document.body.appendChild(container)

  const chunks = []
  let recorder = null
  let stream = null

  try {
    // Start canvas stream
    stream = canvas.captureStream(fps)

    // Set up MediaRecorder
    recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: videoBitrate
    })

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data)
      }
    }

    // Start recording
    recorder.start()

    // Record each slide
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i]

      if (onProgress) {
        onProgress(i + 1, slides.length)
      }

      // Render slide to DOM
      renderSlideToDOM(container, slide)

      // Wait for images to load
      await waitForSlideReady(container, slide)

      // Calculate slide duration
      let duration = slideDelay
      if (slide.type === 'text') {
        const words = (slide.content || '').split(' ')
        const animationTime = words.length * 30 + 800
        duration = Math.max(slideDelay, animationTime)
      }

      // Capture frames for this slide
      const frameInterval = 1000 / fps
      const totalFrames = Math.ceil(duration / frameInterval)

      for (let frame = 0; frame < totalFrames; frame++) {
        await captureFrame(container, canvas, ctx)
        await new Promise(resolve => setTimeout(resolve, frameInterval))
      }

      // Clean up
      container.innerHTML = ''
    }

    // Stop recording
    recorder.stop()

    // Wait for final data
    await new Promise((resolve) => {
      recorder.onstop = resolve
    })

    // Create blob and download
    const blob = new Blob(chunks, { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${presentation.name.replace(/[^a-z0-9]/gi, '_')}.webm`
    a.click()
    URL.revokeObjectURL(url)

  } finally {
    // Clean up
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
    document.body.removeChild(container)
  }
}

/**
 * Render a slide to DOM using pure HTML/CSS
 */
function renderSlideToDOM(container, slide) {
  container.innerHTML = ''

  const slideDiv = document.createElement('div')
  slideDiv.style.width = '100%'
  slideDiv.style.height = '100%'
  slideDiv.style.display = 'flex'
  slideDiv.style.alignItems = 'center'
  slideDiv.style.justifyContent = 'center'
  slideDiv.style.backgroundColor = slide.background || '#000000'
  slideDiv.style.position = 'relative'
  slideDiv.style.overflow = 'hidden'

  if (slide.type === 'text') {
    // Render text slide
    const textDiv = document.createElement('div')
    textDiv.style.fontSize = '6rem'
    textDiv.style.fontWeight = '900'
    textDiv.style.fontFamily = '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    textDiv.style.color = slide.color || '#000000'
    textDiv.style.textAlign = 'center'
    textDiv.style.padding = '2rem'
    textDiv.style.lineHeight = '1.2'
    textDiv.style.maxWidth = '100%'
    textDiv.style.wordWrap = 'break-word'
    textDiv.textContent = slide.content || ''

    slideDiv.appendChild(textDiv)

  } else if (slide.type === 'image' && slide.src) {
    // Render image slide
    const img = document.createElement('img')
    img.src = slide.src
    img.style.display = 'block'

    const fit = slide.fit || 'fullscreen'
    if (fit === 'fullscreen') {
      img.style.width = '100%'
      img.style.height = '100%'
      img.style.objectFit = 'cover'
    } else if (fit === 'inset') {
      img.style.maxWidth = '90%'
      img.style.maxHeight = '90%'
      img.style.objectFit = 'contain'
    } else if (fit === 'positioned') {
      img.style.width = slide.width || 'auto'
      img.style.height = slide.height || 'auto'
      img.style.maxWidth = '90%'
      img.style.maxHeight = '90%'
      img.style.objectFit = 'contain'
    }

    slideDiv.appendChild(img)

  } else if (slide.type === 'video') {
    // For video, show play icon placeholder
    const videoPlaceholder = document.createElement('div')
    videoPlaceholder.style.width = '100%'
    videoPlaceholder.style.height = '100%'
    videoPlaceholder.style.display = 'flex'
    videoPlaceholder.style.alignItems = 'center'
    videoPlaceholder.style.justifyContent = 'center'
    videoPlaceholder.style.fontSize = '8rem'
    videoPlaceholder.textContent = '▶'
    videoPlaceholder.style.color = '#ffffff'

    slideDiv.appendChild(videoPlaceholder)
  }

  container.appendChild(slideDiv)
}

/**
 * Wait for slide to be ready (images loaded, etc)
 */
async function waitForSlideReady(container, slide) {
  if (slide.type === 'image' && slide.src) {
    const images = container.getElementsByTagName('img')
    const imagePromises = Array.from(images).map(img => {
      return new Promise((resolve) => {
        if (img.complete) {
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
  await new Promise(resolve => setTimeout(resolve, 200))
}

/**
 * Capture current container state to canvas
 */
async function captureFrame(container, canvas, ctx) {
  try {
    const tempCanvas = await html2canvas(container, {
      canvas: null,
      scale: 1,
      useCORS: true,
      allowTaint: true,
      logging: false,
      width: 1920,
      height: 1080
    })

    ctx.drawImage(tempCanvas, 0, 0)
  } catch (e) {
    console.error('Frame capture failed:', e)
  }
}

