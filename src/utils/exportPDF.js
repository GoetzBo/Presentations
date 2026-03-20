import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import QRCode from 'qrcode'
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
    slideDiv.style.display = 'flex'
    slideDiv.style.alignItems = 'center'
    slideDiv.style.justifyContent = 'center'

    const textDiv = document.createElement('div')
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

      const displayImg = document.createElement('img')
      displayImg.src = img.src
      displayImg.style.width = slide.width || 'auto'
      displayImg.style.height = slide.height || 'auto'
      displayImg.style.maxWidth = '90%'
      displayImg.style.maxHeight = '90%'
      displayImg.style.objectFit = 'contain'
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
        // Use specified dimensions
        if (slide.width) {
          img.style.width = slide.width
        }
        if (slide.height) {
          img.style.height = slide.height
        }
        img.style.maxWidth = '90%'
        img.style.maxHeight = '90%'
        img.style.objectFit = 'contain'
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




