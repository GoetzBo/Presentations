import { motion } from 'framer-motion'

function TextSlide({ content, color = '#000000', background = '#ffffff' }) {
  return (
    <motion.div
      className="slide"
      style={{ backgroundColor: background }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="slide-text"
        style={{ color }}
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: 1,
          y: [20, 0, -5, 0, -5, 0],
        }}
        transition={{
          opacity: { duration: 0.8 },
          y: {
            duration: 8,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut"
          }
        }}
      >
        {content}
      </motion.div>
    </motion.div>
  )
}

export default TextSlide
