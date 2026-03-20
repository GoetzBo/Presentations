import { useState, useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import TextSlide from './slides/TextSlide'
import ImageSlide from './slides/ImageSlide'
import VideoSlide from './slides/VideoSlide'

function PresentationViewer({ presentation, onExit }) {
  const [slides, setSlides] = useState([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [transitionMode, setTransitionMode] = useState('wait')
  const previousSlideIndex = useRef(0)

  useEffect(() => {
    // TODO: Load and parse presentation markdown
    // For now, create demo slides
    const demoSlides = [
      { type: 'text', content: 'Welcome to the Future', animation: 'cascade-up', color: '#000000', background: '#ffffff' },
      { type: 'image', src: '/presentations/demo/assets/merlin_176725119_67d397c8-13ff-4150-af39-e7ffa3fe95f4-articleLarge.jpg.webp', alt: 'Demo image', fit: 'fullscreen', background: '#000000' },
      { type: 'video', src: '/presentations/demo/assets/CamSwoosh-Oktopus10.mp4', fit: 'fullscreen', background: '#000000', loop: true, muted: true },
      { type: 'text', content: 'Make it exist first', animation: 'cascade-up', color: '#000000', background: '#ffffff' },
      { type: 'video', src: '/presentations/demo/assets/CamSwoosh-Oktopus10.mp4', fit: 'positioned', width: '1280px', background: '#ffffff', loop: true, muted: true },
      { type: 'image', src: '/presentations/demo/assets/merlin_176725119_67d397c8-13ff-4150-af39-e7ffa3fe95f4-articleLarge.jpg.webp', alt: 'Demo image', fit: 'inset', background: '#ffffff' },
      { type: 'text', content: 'Then make it beautiful', animation: 'cascade-up', color: '#000000', background: '#ffffff' }
    ]
    setSlides(demoSlides)

    // Preload images and videos
    demoSlides.forEach(slide => {
      if (slide.type === 'image') {
        const img = new Image()
        img.src = slide.src
      } else if (slide.type === 'video') {
        const video = document.createElement('video')
        video.src = slide.src
        video.preload = 'auto'
      }
    })
  }, [presentation])

  useEffect(() => {
    if (slides.length === 0) return

    const currentSlideData = slides[currentSlide]
    const previousSlideData = slides[previousSlideIndex.current]

    // Check if both current and previous slides are fullscreen media
    const isFullscreenTransition =
      previousSlideData &&
      currentSlideData.fit === 'fullscreen' &&
      previousSlideData.fit === 'fullscreen' &&
      (currentSlideData.type === 'image' || currentSlideData.type === 'video') &&
      (previousSlideData.type === 'image' || previousSlideData.type === 'video')

    setTransitionMode(isFullscreenTransition ? 'sync' : 'wait')
    previousSlideIndex.current = currentSlide
  }, [currentSlide, slides])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1))
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setCurrentSlide((prev) => Math.max(prev - 1, 0))
      } else if (e.key === 'Escape') {
        onExit()
      } else if (e.key === 'f' || e.key === 'F') {
        // Toggle fullscreen
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen()
        } else {
          document.exitFullscreen()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [slides.length, onExit])

  if (slides.length === 0) return null

  const slide = slides[currentSlide]

  return (
    <div className="viewer">
      <AnimatePresence mode={transitionMode}>
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
            width={slide.width}
            height={slide.height}
          />
        )}
        {slide.type === 'video' && (
          <VideoSlide
            key={currentSlide}
            src={slide.src}
            fit={slide.fit}
            background={slide.background}
            loop={slide.loop}
            muted={slide.muted}
            width={slide.width}
            height={slide.height}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default PresentationViewer
