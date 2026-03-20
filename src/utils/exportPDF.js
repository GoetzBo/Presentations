import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { parsePresentation } from './parsePresentation'

/**
 * Export a presentation as PDF (one slide per page, 16:9 aspect ratio)
 * @param {Object} presentation - Presentation object with content, path, name
 * @param {Function} onProgress - Progress callback (current, total)
 * @returns {Promise<void>}
 */
export async function exportPresentationAsPDF(presentation, onProgress) {
  const slides = parsePresentation(presentation.content, presentation.path)

  if (slides.length === 0) {
    throw new Error('No slides found in presentation')
  }

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
    // Render text slide
    const textDiv = document.createElement('div')
    textDiv.style.position = 'absolute'
    textDiv.style.top = '50%'
    textDiv.style.left = '50%'
    textDiv.style.transform = 'translate(-50%, -50%)'
    textDiv.style.width = '100%'
    textDiv.style.fontSize = '6rem'
    textDiv.style.fontWeight = '900'
    textDiv.style.fontFamily = '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    textDiv.style.color = slide.color || '#000000'
    textDiv.style.textAlign = 'center'
    textDiv.style.padding = '2rem'
    textDiv.style.lineHeight = '1.2'
    textDiv.style.wordWrap = 'break-word'
    textDiv.textContent = slide.content || ''

    slideDiv.appendChild(textDiv)

  } else if (slide.type === 'image' && slide.src) {
    // Render image slide with proper fit
    const img = document.createElement('img')
    img.src = slide.src
    img.crossOrigin = 'anonymous'

    const fit = slide.fit || 'fullscreen'

    if (fit === 'fullscreen') {
      // Position absolutely to ensure proper coverage
      img.style.position = 'absolute'
      img.style.top = '0'
      img.style.left = '0'
      img.style.width = '100%'
      img.style.height = '100%'
      img.style.objectFit = 'cover'
      img.style.objectPosition = 'center'
    } else if (fit === 'inset') {
      img.style.position = 'absolute'
      img.style.top = '50%'
      img.style.left = '50%'
      img.style.transform = 'translate(-50%, -50%)'
      img.style.maxWidth = '90%'
      img.style.maxHeight = '90%'
      img.style.width = 'auto'
      img.style.height = 'auto'
      img.style.objectFit = 'contain'
    } else if (fit === 'positioned') {
      img.style.position = 'absolute'
      img.style.top = '50%'
      img.style.left = '50%'
      img.style.transform = 'translate(-50%, -50%)'
      img.style.width = slide.width || 'auto'
      img.style.height = slide.height || 'auto'
      img.style.maxWidth = '90%'
      img.style.maxHeight = '90%'
      img.style.objectFit = 'contain'
    }

    slideDiv.appendChild(img)

  } else if (slide.type === 'video' && slide.src) {
    // Render video as screenshot from middle of video
    const video = document.createElement('video')
    video.src = slide.src
    video.crossOrigin = 'anonymous'
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true
    video.style.display = 'none'

    slideDiv.appendChild(video)

    // Wait for video metadata to load
    await new Promise((resolve) => {
      video.onloadedmetadata = () => {
        // Seek to middle of video
        video.currentTime = video.duration / 2
      }
      video.onseeked = resolve
      video.onerror = resolve
      setTimeout(resolve, 3000) // Timeout
    })

    // Create canvas to capture video frame
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 1920
    canvas.height = video.videoHeight || 1080
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert canvas to image
    const img = document.createElement('img')
    img.src = canvas.toDataURL('image/png')

    const fit = slide.fit || 'fullscreen'

    if (fit === 'fullscreen') {
      // Position absolutely to ensure proper coverage
      img.style.position = 'absolute'
      img.style.top = '0'
      img.style.left = '0'
      img.style.width = '100%'
      img.style.height = '100%'
      img.style.objectFit = 'cover'
      img.style.objectPosition = 'center'
    } else if (fit === 'inset') {
      img.style.position = 'absolute'
      img.style.top = '50%'
      img.style.left = '50%'
      img.style.transform = 'translate(-50%, -50%)'
      img.style.maxWidth = '90%'
      img.style.maxHeight = '90%'
      img.style.width = 'auto'
      img.style.height = 'auto'
      img.style.objectFit = 'contain'
    } else if (fit === 'positioned') {
      img.style.position = 'absolute'
      img.style.top = '50%'
      img.style.left = '50%'
      img.style.transform = 'translate(-50%, -50%)'
      img.style.width = slide.width || 'auto'
      img.style.height = slide.height || 'auto'
      img.style.maxWidth = '90%'
      img.style.maxHeight = '90%'
      img.style.objectFit = 'contain'
    }

    // Remove video, add image
    slideDiv.removeChild(video)
    slideDiv.appendChild(img)
  }

  container.appendChild(slideDiv)
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

  // QR Code placeholder (dummy for now)
  const qrPlaceholder = document.createElement('div')
  qrPlaceholder.style.width = '300px'
  qrPlaceholder.style.height = '300px'
  qrPlaceholder.style.backgroundColor = '#000000'
  qrPlaceholder.style.display = 'flex'
  qrPlaceholder.style.alignItems = 'center'
  qrPlaceholder.style.justifyContent = 'center'
  qrPlaceholder.style.color = '#ffffff'
  qrPlaceholder.style.fontSize = '2rem'
  qrPlaceholder.style.fontWeight = '900'
  qrPlaceholder.style.fontFamily = '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  qrPlaceholder.textContent = 'QR CODE'

  // Text below QR code
  const textDiv = document.createElement('div')
  textDiv.style.fontSize = '1.5rem'
  textDiv.style.color = '#666666'
  textDiv.style.fontFamily = '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  textDiv.textContent = 'Scan to view presentation'

  pageDiv.appendChild(qrPlaceholder)
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

  // Small delay to ensure rendering is complete
  await new Promise(resolve => setTimeout(resolve, 500))
}



