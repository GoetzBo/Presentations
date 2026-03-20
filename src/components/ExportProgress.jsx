import { motion } from 'framer-motion'

function ExportProgress({ current, total }) {
  const progress = Math.round((current / total) * 100)

  return (
    <motion.div
      className="export-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="export-modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <h2>Exporting PDF</h2>
        <div className="export-status">
          Rendering slide {current} of {total}...
        </div>
        <div className="progress-bar">
          <motion.div
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="progress-text">{progress}%</div>
      </motion.div>
    </motion.div>
  )
}

export default ExportProgress
