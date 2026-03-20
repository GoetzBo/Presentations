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
  // Using 297mm width x 167mm height (16:9 ratio)
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
  container.style.width = '1600px' // 16:9 aspect ratio
  container.style.height = '900px'
  container.style.overflow = 'hidden'
  container.style.zIndex = '-9999'
  document.body.appendChild(container)

  try {
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i]

      if (onProgress) {
        onProgress(i + 1, slides.length)
      }

      // Add new page for slides after the first
      if (i > 0) {
        pdf.addPage()
      }

      // Render slide
      renderSlideToDOM(container, slide)

      // Wait for images to load and animations to complete
      await waitForSlideReady(container, slide)

      // Capture slide with html2canvas
      const canvas = await html2canvas(container, {
        scale: 2, // High quality
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

    // Save PDF
    const filename = `${presentation.name.replace(/[^a-z0-9]/gi, '_')}.pdf`
    pdf.save(filename)

  } finally {
    // Clean up container
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
  slideDiv.style.backgroundColor = slide.background || '#ffffff'
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
    // For video, show first frame or placeholder
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
    // Wait for images to load
    const images = container.getElementsByTagName('img')
    const imagePromises = Array.from(images).map(img => {
      return new Promise((resolve) => {
        if (img.complete) {
          resolve()
        } else {
          img.onload = resolve
          img.onerror = resolve // Continue even if image fails
          setTimeout(resolve, 3000) // Timeout after 3s
        }
      })
    })
    await Promise.all(imagePromises)
  }

  // Small delay to ensure rendering is complete
  await new Promise(resolve => setTimeout(resolve, 300))
}

