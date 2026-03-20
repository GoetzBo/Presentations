import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

function VideoSlide({ src, fit = 'fullscreen', background = '#000000', loop = true, muted = true, width, height }) {
  const videoRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(true)

  useEffect(() => {
    // Auto-play video when slide loads
    if (videoRef.current) {
      videoRef.current.play().catch(err => {
        console.log('Autoplay prevented:', err)
      })
    }
  }, [src])

  useEffect(() => {
    const handleSpacebar = (e) => {
      if (e.code === 'Space') {
        e.preventDefault()
        if (videoRef.current) {
          if (isPlaying) {
            videoRef.current.pause()
            setIsPlaying(false)
          } else {
            videoRef.current.play()
            setIsPlaying(true)
          }
        }
      }
    }

    window.addEventListener('keydown', handleSpacebar)
    return () => window.removeEventListener('keydown', handleSpacebar)
  }, [isPlaying])

  const getVideoStyle = () => {
    switch (fit) {
      case 'fullscreen':
        return {
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block'
        }
      case 'inset':
        return {
          maxWidth: '90%',
          maxHeight: '90%',
          width: 'auto',
          height: 'auto',
          objectFit: 'contain',
          display: 'block'
        }
      case 'positioned':
        return {
          width: width || '1280px',
          height: height || 'auto',
          maxWidth: '90%',
          maxHeight: '90%',
          display: 'block',
          objectFit: 'contain'
        }
      default:
        return {
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block'
        }
    }
  }

  return (
    <motion.div
      className="slide"
      style={{
        backgroundColor: fit === 'fullscreen' ? 'transparent' : background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      initial={{ opacity: 0, filter: 'blur(20px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, filter: 'blur(20px)' }}
      transition={{
        opacity: { duration: 0.6 },
        filter: { duration: 0.8, ease: 'easeInOut' }
      }}
    >
      <video
        ref={videoRef}
        src={src}
        loop={loop}
        muted={muted}
        playsInline
        style={getVideoStyle()}
      />
    </motion.div>
  )
}

export default VideoSlide
