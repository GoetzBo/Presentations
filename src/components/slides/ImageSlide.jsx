import { motion } from 'framer-motion'

const ANCHOR_MAP = {
  'top':          { alignItems: 'flex-start', justifyContent: 'center' },
  'bottom':       { alignItems: 'flex-end',   justifyContent: 'center' },
  'left':         { alignItems: 'center',     justifyContent: 'flex-start' },
  'right':        { alignItems: 'center',     justifyContent: 'flex-end' },
  'top-left':     { alignItems: 'flex-start', justifyContent: 'flex-start' },
  'top-right':    { alignItems: 'flex-start', justifyContent: 'flex-end' },
  'bottom-left':  { alignItems: 'flex-end',   justifyContent: 'flex-start' },
  'bottom-right': { alignItems: 'flex-end',   justifyContent: 'flex-end' },
  'center':       { alignItems: 'center',     justifyContent: 'center' },
}

function ImageSlide({ src, alt = '', fit = 'fullscreen', background = '#000000', width, height, anchor = 'center' }) {
  const { alignItems, justifyContent } = ANCHOR_MAP[anchor] ?? ANCHOR_MAP['center']
  const getImageStyle = () => {
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
          width: width || 'auto',
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

  const containerStyle = { backgroundColor: background, display: 'flex', alignItems, justifyContent }

  if (!src) {
    return (
      <motion.div
        className="slide"
        style={containerStyle}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
    )
  }

  return (
    <motion.div
      className="slide"
      style={containerStyle}
      initial={{ opacity: 0, filter: 'blur(20px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, filter: 'blur(20px)' }}
      transition={{
        opacity: { duration: 0.3 },
        filter: { duration: 0.4, ease: 'easeInOut' }
      }}
    >
      <img
        src={src}
        alt={alt}
        style={getImageStyle()}
        onError={(e) => {
          // Hide broken image icon on error
          e.target.style.display = 'none'
        }}
      />
    </motion.div>
  )
}

export default ImageSlide
