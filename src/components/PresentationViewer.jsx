import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import TextSlide from './slides/TextSlide'
import ImageSlide from './slides/ImageSlide'

function PresentationViewer({ presentation, onExit }) {
  const [slides, setSlides] = useState([])
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    // TODO: Load and parse presentation markdown
    // For now, create demo slides
    setSlides([
      { type: 'text', content: 'Welcome to the Future', animation: 'cascade-up', color: '#000000', background: '#ffffff' },
      { type: 'image', src: '/presentations/demo/assets/merlin_176725119_67d397c8-13ff-4150-af39-e7ffa3fe95f4-articleLarge.jpg.webp', alt: 'Demo image', fit: 'fullscreen', background: '#000000' },
      { type: 'text', content: 'Make it exist first', animation: 'cascade-up', color: '#000000', background: '#ffffff' },
      { type: 'image', src: '/presentations/demo/assets/merlin_176725119_67d397c8-13ff-4150-af39-e7ffa3fe95f4-articleLarge.jpg.webp', alt: 'Demo image', fit: 'inset', background: '#ffffff' },
      { type: 'text', content: 'Then make it beautiful', animation: 'cascade-up', color: '#000000', background: '#ffffff' }
    ])
  }, [presentation])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1))
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setCurrentSlide((prev) => Math.max(prev - 1, 0))
      } else if (e.key === 'Escape') {
        onExit()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [slides.length, onExit])

  if (slides.length === 0) return null

  const slide = slides[currentSlide]

  return (
    <div className="viewer">
      <AnimatePresence mode="wait">
        {slide.type === 'text' && (
          <TextSlide
            key={currentSlide}
            content={slide.content}
            color={slide.color}
            background={slide.background}
            animation={slide.animation}
          />
        )}
        {slide.type === 'image' && (
          <ImageSlide
            key={currentSlide}
            src={slide.src}
            alt={slide.alt}
            fit={slide.fit}
            background={slide.background}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default PresentationViewer
