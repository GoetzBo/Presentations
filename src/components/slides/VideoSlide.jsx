import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

function VideoSlide({ src, fit = 'fullscreen', background = '#000000', loop = true, muted = true, width, height }) {
  const videoRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(true)

  // Debug
  console.log('VideoSlide props:', { src, fit, background, loop, muted })

  // Check if URL is a YouTube link
  const isYouTube = src && (src.includes('youtube.com') || src.includes('youtu.be'))
  console.log('isYouTube:', isYouTube)

  // Convert YouTube URL to embed URL
  const getYouTubeEmbedUrl = (url) => {
    let videoId = ''

    if (url.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(new URL(url).search)
      videoId = urlParams.get('v')
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0]
    }

    if (videoId) {
      // Remove controls, info, and branding. Add preload.
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${muted ? 1 : 0}&loop=${loop ? 1 : 0}&playlist=${videoId}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1`
    }

    return url
  }

  useEffect(() => {
    // Auto-play video when slide loads (only for native videos, not YouTube)
    if (videoRef.current && !isYouTube) {
      videoRef.current.play().catch(err => {
        console.log('Autoplay prevented:', err)
      })
    }
  }, [src, isYouTube])

  useEffect(() => {
    // Spacebar control only for native videos, not YouTube
    if (isYouTube) return

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
  }, [isPlaying, isYouTube])

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
      {isYouTube ? (
        <iframe
          src={getYouTubeEmbedUrl(src)}
          style={getVideoStyle()}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <video
          ref={videoRef}
          src={src}
          loop={loop}
          muted={muted}
          playsInline
          style={getVideoStyle()}
        />
      )}
    </motion.div>
  )
}

export default VideoSlide
