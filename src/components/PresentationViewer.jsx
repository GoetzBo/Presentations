import { useState, useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import TextSlide from './slides/TextSlide'
import ImageSlide from './slides/ImageSlide'
import VideoSlide from './slides/VideoSlide'
import { parsePresentation } from '../utils/parsePresentation'

function PresentationViewer({ presentation, onExit }) {
  const [slides, setSlides] = useState([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [transitionMode, setTransitionMode] = useState('wait')
  const [isStarted, setIsStarted] = useState(false)
  const previousSlideIndex = useRef(0)

  useEffect(() => {
    if (!presentation) return

    // Parse markdown into slides
    const parsedSlides = parsePresentation(presentation.content, presentation.path)
    setSlides(parsedSlides)

    // Preload images and videos
    parsedSlides.forEach(slide => {
      if (slide.type === 'image') {
        const img = new Image()
        img.src = slide.src
      } else if (slide.type === 'video') {
        const video = document.createElement('video')
        video.src = slide.src
        video.preload = 'auto'
      }
    })

    // Reset to first slide when presentation changes
    setCurrentSlide(0)
    setIsStarted(false)
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
      // Start presentation on first keypress
      if (!isStarted) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.code === 'Space') {
          e.preventDefault()
          setIsStarted(true)
          return
        }
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1))
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setCurrentSlide((prev) => Math.max(prev - 1, 0))
      } else if (e.key === 'Escape') {
        // Escape exits fullscreen if in fullscreen, otherwise returns to selection page
        if (document.fullscreenElement) {
          document.exitFullscreen()
        } else {
          onExit()
        }
      } else if (e.key === 'f' || e.key === 'F') {
        // F toggles fullscreen on/off
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen()
        } else {
          document.exitFullscreen()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [slides.length, onExit, isStarted])

  if (slides.length === 0) return null

  const slide = slides[currentSlide]

  return (
    <div className="viewer">
      <AnimatePresence mode={transitionMode}>
        {isStarted && slide.type === 'text' && (
          <TextSlide
            key={currentSlide}
            content={slide.content}
            color={slide.color}
            background={slide.background}
            animation={slide.animation}
          />
        )}
        {isStarted && slide.type === 'image' && (
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
        {isStarted && slide.type === 'video' && (
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
      {!isStarted && (
        <div style={{
          width: '100%',
          height: '100%',
          backgroundColor: slide.background || '#ffffff',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 0
        }} />
      )}
    </div>
  )
}

export default PresentationViewer
