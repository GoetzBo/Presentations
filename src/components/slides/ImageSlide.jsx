import { motion } from 'framer-motion'

function ImageSlide({ src, alt = '', fit = 'fullscreen', background = '#000000', width, height }) {
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

  // Handle missing src gracefully
  if (!src) {
    return (
      <motion.div
        className="slide"
        style={{
          backgroundColor: background,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Empty slide - image source missing */}
      </motion.div>
    )
  }

  return (
    <motion.div
      className="slide"
      style={{
        backgroundColor: background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
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
