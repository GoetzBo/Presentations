import { motion } from 'framer-motion'
import { getAnimation } from '../../animations'

function TextSlide({ content, color = '#000000', background = '#ffffff', animation = 'cascade-up' }) {
  const words = content.split(' ')
  const animConfig = getAnimation('text', animation)

  return (
    <motion.div
      className="slide"
      style={{ backgroundColor: background }}
      initial={{ opacity: 0, filter: 'blur(20px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, filter: 'blur(20px)' }}
      transition={{
        opacity: { duration: 0.6 },
        filter: { duration: 0.8, ease: 'easeInOut' }
      }}
    >
      <div className="slide-text" style={{ color }}>
        {words.map((word, index) => (
          <motion.span
            key={index}
            style={{ display: 'inline-block', marginRight: '0.3em' }}
            initial={{ opacity: 0, y: animConfig.initialY }}
            animate={{
              opacity: 1,
              y: animConfig.finalY,
            }}
            transition={{
              opacity: {
                duration: animConfig.opacityDuration,
                ease: "easeOut",
                delay: index * animConfig.staggerDelay
              },
              y: {
                duration: animConfig.movementDuration,
                ease: animConfig.ease,
                delay: index * animConfig.staggerDelay
              }
            }}
          >
            {word}
          </motion.span>
        ))}
      </div>
    </motion.div>
  )
}

export default TextSlide
