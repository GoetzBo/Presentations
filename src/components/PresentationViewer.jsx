import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import TextSlide from './slides/TextSlide'
import ImageSlide from './slides/ImageSlide'
import VideoSlide from './slides/VideoSlide'
import SlideOverview from './SlideOverview'
import { parsePresentation } from '../utils/parsePresentation'
import { useSwipe } from '../hooks/useSwipe'

function PresentationViewer({ presentation, onExit }) {
  const [slides, setSlides] = useState([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [transitionMode, setTransitionMode] = useState('wait')
  const [isStarted, setIsStarted] = useState(false)
  const [showOverview, setShowOverview] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const controlsTimer = useRef(null)
  const isTouchDevice = 'ontouchstart' in window
  const previousSlideIndex = useRef(0)

  const resetControlsTimer = useCallback(() => {
    setControlsVisible(true)
    clearTimeout(controlsTimer.current)
    controlsTimer.current = setTimeout(() => setControlsVisible(false), 3000)
  }, [])

  useEffect(() => {
    if (!isTouchDevice) return
    resetControlsTimer()
    window.addEventListener('touchstart', resetControlsTimer, { passive: true })
    return () => {
      window.removeEventListener('touchstart', resetControlsTimer)
      clearTimeout(controlsTimer.current)
    }
  }, [isTouchDevice, resetControlsTimer])

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
        // Check if it's a YouTube URL
        const isYouTube = slide.src && (slide.src.includes('youtube.com') || slide.src.includes('youtu.be'))
        if (!isYouTube) {
          // Only preload direct video files, not YouTube
          const video = document.createElement('video')
          video.src = slide.src
          video.preload = 'auto'
        }
        // YouTube videos are preloaded by the browser when iframe is created
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

    // Check if this is a continuation transition (text slides where new content extends previous)
    const isContinuationTransition =
      previousSlideData?.type === 'text' &&
      currentSlideData.type === 'text' &&
      currentSlideData.content?.trimStart().startsWith(previousSlideData.content?.trim())

    setTransitionMode(isFullscreenTransition || isContinuationTransition ? 'sync' : 'wait')
    previousSlideIndex.current = currentSlide
  }, [currentSlide, slides])

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Overview toggle
      if (e.key === 'o' || e.key === 'O') {
        setShowOverview(prev => !prev)
        return
      }

      if (e.key === 'Escape') {
        if (showOverview) {
          setShowOverview(false)
          return
        }
        if (!document.fullscreenElement) {
          onExit()
        }
        // if fullscreen is active, browser exits it — we catch that via fullscreenchange below
        return
      }

      // Block navigation keys when overview is open
      if (showOverview) return

      const isAdvance = e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.code === 'Space' || e.key === 'Enter'
      const isBack = e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'Backspace' || e.key === 'Delete'

      if (!isStarted) {
        if (isAdvance || isBack) {
          e.preventDefault()
          setIsStarted(true)
          return
        }
      }

      if (isAdvance) {
        e.preventDefault()
        setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1))
      } else if (isBack) {
        e.preventDefault()
        setCurrentSlide((prev) => Math.max(prev - 1, 0))
      } else if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen()
        } else {
          document.exitFullscreen()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [slides.length, onExit, isStarted, showOverview])

  const handleSwipeNext = useCallback(() => {
    if (showOverview) return
    if (!isStarted) { setIsStarted(true); return }
    setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1))
  }, [showOverview, isStarted, slides.length])

  const handleSwipePrev = useCallback(() => {
    if (showOverview) return
    if (!isStarted) { setIsStarted(true); return }
    setCurrentSlide((prev) => Math.max(prev - 1, 0))
  }, [showOverview, isStarted])

  useSwipe({ onNext: handleSwipeNext, onPrev: handleSwipePrev })

  if (slides.length === 0) return null

  const slide = slides[currentSlide]
  const prevSlide = currentSlide > 0 ? slides[currentSlide - 1] : null
  const nextSlide = currentSlide < slides.length - 1 ? slides[currentSlide + 1] : null

  // Continuation: current slide is a text slide whose content starts with all lines of the previous text slide
  const isContinuation = !!(
    slide.type === 'text' &&
    prevSlide?.type === 'text' &&
    prevSlide?.content &&
    slide.content &&
    slide.content.trimStart().startsWith(prevSlide.content.trim())
  )

  // Whether the next slide is a continuation of the current one (so current slide should exit instantly)
  const nextIsContinuation = !!(
    nextSlide?.type === 'text' &&
    slide.type === 'text' &&
    slide.content &&
    nextSlide.content?.trimStart().startsWith(slide.content.trim())
  )

  // Walk back to find the root of the continuation chain for a stable React key
  const continuationRootKey = (() => {
    if (!isContinuation) return null
    let i = currentSlide
    while (i > 0) {
      const cur = slides[i]
      const prev = slides[i - 1]
      if (
        cur.type === 'text' && prev?.type === 'text' &&
        cur.content?.trimStart().startsWith(prev.content?.trim())
      ) { i-- } else break
    }
    return `cont-root-${i}`
  })()

  return (
    <div
      className="viewer"
      onClick={() => {
        if (isTouchDevice || showOverview) return
        if (!isStarted) { setIsStarted(true); return }
        setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1))
      }}
    >
      <AnimatePresence mode={transitionMode}>
        {isStarted && slide.type === 'text' && !isContinuation && (
          <TextSlide
            key={currentSlide}
            content={slide.content}
            previousContent={null}
            color={slide.color}
            background={slide.background}
            animation={slide.animation}
            font={slide.font}
            instantExit={nextIsContinuation}
          />
        )}
        {isStarted && slide.type === 'text' && isContinuation && (
          <TextSlide
            key={continuationRootKey}
            content={slide.content}
            previousContent={prevSlide.content}
            color={slide.color}
            background={slide.background}
            animation={slide.animation}
            font={slide.font}
            instantExit={nextIsContinuation}
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
            anchor={slide.anchor}
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
      <AnimatePresence>
        {showOverview && (
          <SlideOverview
            slides={slides}
            currentSlide={currentSlide}
            onSelect={(i) => { setCurrentSlide(i); setIsStarted(true); setShowOverview(false) }}
            onClose={() => setShowOverview(false)}
          />
        )}
      </AnimatePresence>
      {isTouchDevice && (
        <AnimatePresence>
          {controlsVisible && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                position: 'fixed',
                top: 16,
                right: 16,
                zIndex: 200,
                display: 'flex',
                gap: 8,
              }}
            >
              <button
                onClick={() => setShowOverview(prev => !prev)}
                style={mobileButtonStyle}
                aria-label="Slide overview"
              >
                ⊞
              </button>
              <button
                onClick={onExit}
                style={mobileButtonStyle}
                aria-label="Exit presentation"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}

const mobileButtonStyle = {
  width: 44,
  height: 44,
  borderRadius: 12,
  border: 'none',
  background: 'rgba(0,0,0,0.45)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  color: '#fff',
  fontSize: '1.1rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  touchAction: 'manipulation',
}

export default PresentationViewer
