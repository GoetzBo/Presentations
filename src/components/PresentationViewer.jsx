import { useState, useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import TextSlide from './slides/TextSlide'
import ImageSlide from './slides/ImageSlide'
import VideoSlide from './slides/VideoSlide'
import SlideOverview from './SlideOverview'
import { parsePresentation } from '../utils/parsePresentation'

function PresentationViewer({ presentation, onExit }) {
  const [slides, setSlides] = useState([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [transitionMode, setTransitionMode] = useState('wait')
  const [isStarted, setIsStarted] = useState(false)
  const [showOverview, setShowOverview] = useState(false)
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
    <div className="viewer">
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
          zIndex: 0,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          paddingBottom: '2rem',
        }}>
          <div style={{
            display: 'flex',
            gap: '1.5rem',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '0.6rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(0,0,0,0.2)',
            userSelect: 'none',
          }}>
            {[
              ['→ / Space', 'advance'],
              ['← / Backspace', 'back'],
              ['O', 'overview / close'],
              ['F', 'fullscreen'],
              ['Esc', 'exit'],
            ].map(([key, label]) => (
              <span key={key}><span style={{ fontWeight: 700 }}>{key}</span> {label}</span>
            ))}
          </div>
        </div>
      )}
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
    </div>
  )
}

export default PresentationViewer
