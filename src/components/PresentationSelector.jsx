import { useState, useEffect, useRef } from 'react'
import { loadPresentations } from '../utils/loadPresentations'
import { parsePresentation } from '../utils/parsePresentation'

function PresentationSelector({ onSelect }) {
  const [presentations, setPresentations] = useState([])
  const [thumbnails, setThumbnails] = useState({})
  const canvasRef = useRef(null)

  useEffect(() => {
    loadPresentations()
      .then(async (loadedPresentations) => {
        setPresentations(loadedPresentations)

        // Generate thumbnails for each presentation
        const thumbs = {}
        for (const presentation of loadedPresentations) {
          thumbs[presentation.id] = await generateThumbnail(presentation)
        }
        setThumbnails(thumbs)
      })
      .catch(error => {
        console.error('Failed to load presentations:', error)
        setPresentations([])
      })
  }, [])

  const generateThumbnail = async (presentation) => {
    // Parse to get first slide
    const slides = parsePresentation(presentation.content, presentation.path)
    if (slides.length === 0) return null

    const firstSlide = slides[0]

    // Create a canvas for rendering thumbnail
    const canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 225 // 16:9 aspect ratio
    const ctx = canvas.getContext('2d')

    // Handle different slide types
    if (firstSlide.type === 'text') {
      // Draw text slide
      ctx.fillStyle = firstSlide.background || '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = firstSlide.color || '#000000'
      ctx.font = 'bold 32px "SF Pro Display", sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // Wrap text if too long
      const text = firstSlide.content || ''
      const maxWidth = canvas.width - 40
      const words = text.split(' ')
      let line = ''
      const lines = []

      for (const word of words) {
        const testLine = line + word + ' '
        const metrics = ctx.measureText(testLine)
        if (metrics.width > maxWidth && line !== '') {
          lines.push(line)
          line = word + ' '
        } else {
          line = testLine
        }
      }
      lines.push(line)

      // Draw lines centered
      const lineHeight = 40
      const startY = (canvas.height - (lines.length - 1) * lineHeight) / 2
      lines.slice(0, 3).forEach((line, i) => {
        ctx.fillText(line.trim(), canvas.width / 2, startY + i * lineHeight)
      })

    } else if (firstSlide.type === 'image' && firstSlide.src) {
      // Draw image slide
      try {
        const img = await loadImage(firstSlide.src)
        ctx.fillStyle = firstSlide.background || '#000000'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Draw image centered and scaled
        const scale = Math.max(canvas.width / img.width, canvas.height / img.height)
        const x = (canvas.width - img.width * scale) / 2
        const y = (canvas.height - img.height * scale) / 2
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale)
      } catch (e) {
        // Fallback to solid color
        ctx.fillStyle = firstSlide.background || '#000000'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

    } else if (firstSlide.type === 'video') {
      // Draw solid background for video (can't render video in canvas easily)
      ctx.fillStyle = firstSlide.background || '#000000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Add video icon or text
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 48px "SF Pro Display", sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('▶', canvas.width / 2, canvas.height / 2)
    }

    return canvas.toDataURL()
  }

  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  const enterFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen()
    }
  }

  return (
    <div className="selector">
      <h1>Presentations</h1>
      <div className="presentation-grid">
        {presentations.length === 0 ? (
          <div className="presentation-card empty">
            No presentations found
          </div>
        ) : (
          presentations.map((presentation) => (
            <div
              key={presentation.id}
              className="presentation-card"
              onClick={() => {
                enterFullscreen()
                onSelect(presentation)
              }}
            >
              <div className="presentation-thumbnail">
                {thumbnails[presentation.id] ? (
                  <img src={thumbnails[presentation.id]} alt={presentation.name} />
                ) : (
                  <div className="thumbnail-loading" />
                )}
              </div>
              <div className="presentation-title">{presentation.name}</div>
            </div>
          ))
        )}
      </div>
      <div style={{ marginTop: '2rem', fontSize: '0.9rem', opacity: 0.6, lineHeight: '1.8', textAlign: 'center' }}>
        <div>Press <kbd style={{ padding: '2px 6px', background: 'transparent', border: '1px solid currentColor', borderRadius: '3px', fontFamily: 'monospace' }}>F</kbd> to toggle fullscreen.</div>
        <div>Use <kbd style={{ padding: '2px 6px', background: 'transparent', border: '1px solid currentColor', borderRadius: '3px', fontFamily: 'monospace' }}>Arrow Keys</kbd> or <kbd style={{ padding: '2px 6px', background: 'transparent', border: '1px solid currentColor', borderRadius: '3px', fontFamily: 'monospace' }}>Space</kbd> to navigate slides.</div>
        <div>Press <kbd style={{ padding: '2px 6px', background: 'transparent', border: '1px solid currentColor', borderRadius: '3px', fontFamily: 'monospace' }}>Esc</kbd> to exit fullscreen or return to selection.</div>
      </div>
    </div>
  )
}

export default PresentationSelector
