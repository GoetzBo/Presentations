import { useEffect, useRef } from 'react'

export function useSwipe({ onNext, onPrev, threshold = 50 }) {
  const startX = useRef(null)
  const startY = useRef(null)

  useEffect(() => {
    const onTouchStart = (e) => {
      startX.current = e.touches[0].clientX
      startY.current = e.touches[0].clientY
    }

    const onTouchEnd = (e) => {
      if (startX.current === null) return
      const dx = e.changedTouches[0].clientX - startX.current
      const dy = e.changedTouches[0].clientY - startY.current
      startX.current = null
      startY.current = null

      // Ignore if vertical scroll was dominant
      if (Math.abs(dy) > Math.abs(dx)) return
      if (Math.abs(dx) < threshold) return

      if (dx < 0) onNext?.()
      else onPrev?.()
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [onNext, onPrev, threshold])
}
