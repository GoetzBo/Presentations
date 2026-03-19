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
        filter: { duration: 0.5, ease: 'easeInOut' }
      }}
    >
      <img
        src={src}
        alt={alt}
        style={getImageStyle()}
      />
    </motion.div>
  )
}

export default ImageSlide
