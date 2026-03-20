import { motion } from 'framer-motion'

function ExportProgress({ type, current, total, onCancel }) {
  const progress = Math.round((current / total) * 100)
  const typeLabel = type === 'pdf' ? 'PDF' : 'Video'

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
        <h2>Exporting {typeLabel}</h2>
        <div className="export-status">
          {type === 'pdf' ? 'Rendering' : 'Recording'} slide {current} of {total}...
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
        {onCancel && (
          <button className="cancel-button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </motion.div>
    </motion.div>
  )
}

export default ExportProgress
