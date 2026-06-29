import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import TextSlide from './slides/TextSlide'
import ImageSlide from './slides/ImageSlide'
import VideoSlide from './slides/VideoSlide'

function SlideThumbnail({ slide, index, isCurrent, onClick }) {
  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.18, delay: index * 0.025 }}
      style={{
        position: 'relative',
        cursor: 'pointer',
        borderRadius: 8,
        overflow: 'hidden',
        aspectRatio: '16/9',
        outline: isCurrent ? '3px solid rgba(0,0,0,0.7)' : '2px solid rgba(0,0,0,0.12)',
        outlineOffset: isCurrent ? 2 : 0,
        boxShadow: isCurrent ? '0 0 0 4px rgba(0,0,0,0.12)' : '0 2px 12px rgba(0,0,0,0.15)',
        transition: 'outline 0.15s, box-shadow 0.15s',
        background: slide.background || '#fff',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: 'scale(0.2)',
          transformOrigin: 'top left',
          width: '500%',
          height: '500%',
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        {slide.type === 'text' && (
          <TextSlide
            content={slide.content}
            color={slide.color}
            background={slide.background}
            animation="none"
          />
        )}
        {slide.type === 'image' && (
          <ImageSlide
            src={slide.src}
            alt={slide.alt}
            fit={slide.fit}
            background={slide.background}
          />
        )}
        {slide.type === 'video' && (
          <div style={{
            width: '100%', height: '100%',
            background: slide.background || '#000',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '4rem', opacity: 0.4 }}>▶</span>
          </div>
        )}
      </div>
      {/* slide number */}
      <div style={{
        position: 'absolute', bottom: 4, right: 6,
        fontSize: 9, fontWeight: 700, color: 'rgba(0,0,0,0.35)',
        fontFamily: 'system-ui, sans-serif',
        zIndex: 2,
      }}>
        {index + 1}
      </div>
    </motion.div>
  )
}

export default function SlideOverview({ slides, currentSlide, onSelect, onClose }) {
  const gridRef = useRef(null)

  // Scroll selected thumbnail into view when overview opens
  useEffect(() => {
    if (!gridRef.current) return
    const el = gridRef.current.querySelector(`[data-idx="${currentSlide}"]`)
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [currentSlide])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 48px 32px',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      {/* header */}
      <div style={{
        width: '100%', maxWidth: 1200,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 28, flexShrink: 0,
      }}>
        <span style={{ fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', fontFamily: 'system-ui, sans-serif' }}>
          {slides.length} slides
        </span>
        <span style={{ fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.25)', fontFamily: 'system-ui, sans-serif' }}>
          O / esc to close
        </span>
      </div>

      {/* grid */}
      <div
        ref={gridRef}
        onClick={e => e.stopPropagation()}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
          width: '100%',
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        {slides.map((slide, i) => (
          <div key={i} data-idx={i}>
            <SlideThumbnail
              slide={slide}
              index={i}
              isCurrent={i === currentSlide}
              onClick={() => onSelect(i)}
            />
          </div>
        ))}
      </div>
    </motion.div>
  )
}
