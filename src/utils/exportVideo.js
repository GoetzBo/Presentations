import { parsePresentation } from './parsePresentation'

/**
 * Record a presentation as video using MediaRecorder API
 * @param {Object} presentation - Presentation object with content, path, name
 * @param {Object} options - Recording options
 * @param {Function} onProgress - Progress callback (current, total)
 * @returns {Promise<void>}
 */
export async function recordPresentationAsVideo(presentation, options = {}, onProgress) {
  const {
    slideDelay = 3000,
    videoBitrate = 5000000
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

  // Create fullscreen container for rendering
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.top = '0'
  container.style.left = '0'
  container.style.width = '100vw'
  container.style.height = '100vh'
  container.style.zIndex = '10000'
  container.style.backgroundColor = '#000000'
  document.body.appendChild(container)

  const chunks = []
  let recorder = null
  let stream = null

  try {
    // Capture the container as a stream
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface: 'browser',
        width: 1920,
        height: 1080,
        frameRate: 30
      }
    }).catch(() => {
      // Fallback: use canvas stream
      return null
    })

    if (!stream) {
      throw new Error('Could not capture screen. Please allow screen recording when prompted.')
    }

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

    const recordingPromise = new Promise((resolve, reject) => {
      recorder.onstop = resolve
      recorder.onerror = reject
    })

    // Start recording
    recorder.start()

    // Render each slide
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i]

      if (onProgress) {
        onProgress(i + 1, slides.length)
      }

      // Render slide
      await renderSlideToDOM(container, slide)

      // Wait for slide duration
      await new Promise(resolve => setTimeout(resolve, slideDelay))

      // Clean up
      container.innerHTML = ''
    }

    // Stop recording
    recorder.stop()
    await recordingPromise

    // Stop all tracks
    stream.getTracks().forEach(track => track.stop())

    // Create blob and download
    const blob = new Blob(chunks, { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${presentation.name.replace(/[^a-z0-9]/gi, '_')}.webm`
    a.click()
    URL.revokeObjectURL(url)

  } catch (error) {
    console.error('Video recording error:', error)
    throw error
  } finally {
    // Clean up
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
    if (container && container.parentNode) {
      document.body.removeChild(container)
    }
  }
}

/**
 * Render a slide to DOM
 */
async function renderSlideToDOM(container, slide) {
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
      img.style.width = 'auto'
      img.style.height = 'auto'
      img.style.objectFit = 'contain'
    } else if (fit === 'positioned') {
      img.style.width = slide.width || 'auto'
      img.style.height = slide.height || 'auto'
      img.style.maxWidth = '90%'
      img.style.maxHeight = '90%'
      img.style.objectFit = 'contain'
    }

    slideDiv.appendChild(img)

    // Wait for image to load
    await new Promise((resolve) => {
      if (img.complete) {
        resolve()
      } else {
        img.onload = resolve
        img.onerror = resolve
        setTimeout(resolve, 2000)
      }
    })

  } else if (slide.type === 'video' && slide.src) {
    // Render video slide
    const video = document.createElement('video')
    video.src = slide.src
    video.autoplay = true
    video.loop = slide.loop || false
    video.muted = slide.muted !== false
    video.playsInline = true
    video.style.display = 'block'

    const fit = slide.fit || 'fullscreen'
    if (fit === 'fullscreen') {
      video.style.width = '100%'
      video.style.height = '100%'
      video.style.objectFit = 'cover'
    } else if (fit === 'inset') {
      video.style.maxWidth = '90%'
      video.style.maxHeight = '90%'
      video.style.width = 'auto'
      video.style.height = 'auto'
      video.style.objectFit = 'contain'
    } else if (fit === 'positioned') {
      video.style.width = slide.width || 'auto'
      video.style.height = slide.height || 'auto'
      video.style.maxWidth = '90%'
      video.style.maxHeight = '90%'
      video.style.objectFit = 'contain'
    }

    slideDiv.appendChild(video)

    // Wait for video to be ready
    await new Promise((resolve) => {
      if (video.readyState >= 2) {
        video.play().catch(() => {})
        resolve()
      } else {
        video.oncanplay = () => {
          video.play().catch(() => {})
          resolve()
        }
        video.onerror = resolve
        setTimeout(resolve, 2000)
      }
    })
  }

  container.appendChild(slideDiv)
}


