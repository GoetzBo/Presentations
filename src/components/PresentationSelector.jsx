import { useState, useEffect } from 'react'
import { loadPresentations } from '../utils/loadPresentations'
import { exportPresentationAsPDF } from '../utils/exportPDF'
import ExportProgress from './ExportProgress'
import { AnimatePresence } from 'framer-motion'

function PresentationSelector({ onSelect }) {
  const [presentations, setPresentations] = useState([])
  const [exportState, setExportState] = useState(null) // { type: 'pdf', current: 0, total: 0, presentation: {} }
  const [currentPage, setCurrentPage] = useState(0)
  const itemsPerPage = 12

  useEffect(() => {
    loadPresentations()
      .then((loadedPresentations) => {
        setPresentations(loadedPresentations)
      })
      .catch(error => {
        console.error('Failed to load presentations:', error)
        setPresentations([])
      })
  }, [])

  const totalPages = Math.ceil(presentations.length / itemsPerPage)
  const startIndex = currentPage * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPresentations = presentations.slice(startIndex, endIndex)

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1))
  }

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))
  }

  const handleExportPDF = async (e, presentation) => {
    e.stopPropagation()

    setExportState({
      type: 'pdf',
      current: 0,
      total: 1,
      presentation
    })

    try {
      await exportPresentationAsPDF(presentation, (current, total) => {
        setExportState({
          type: 'pdf',
          current,
          total,
          presentation
        })
      })
      setExportState(null)
    } catch (error) {
      console.error('PDF export failed:', error)
      alert(`Failed to export PDF: ${error.message}`)
      setExportState(null)
    }
  }

  const handleCancelExport = () => {
    setExportState(null)
  }

  const enterFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen()
    }
  }

  return (
    <div className="selector">
      <h1>Presentations</h1>

      <div className="pagination-container">
        {totalPages > 1 && currentPage > 0 && (
          <button className="pagination-arrow prev" onClick={goToPreviousPage}>
            ‹
          </button>
        )}

        <div className="presentation-list">
          {currentPresentations.length === 0 ? (
            <div className="presentation-item empty">
              No presentations found
            </div>
          ) : (
            currentPresentations.map((presentation) => (
              <div key={presentation.id} className="presentation-item">
                <div
                  className="presentation-name"
                  onClick={() => {
                    enterFullscreen()
                    onSelect(presentation)
                  }}
                >
                  {presentation.name}
                </div>
                <div className="presentation-actions">
                  <span
                    className="export-link"
                    onClick={(e) => handleExportPDF(e, presentation)}
                  >
                    Export PDF
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && currentPage < totalPages - 1 && (
          <button className="pagination-arrow next" onClick={goToNextPage}>
            ›
          </button>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination-dots">
          {Array.from({ length: totalPages }).map((_, index) => (
            <span
              key={index}
              className={`dot ${index === currentPage ? 'active' : ''}`}
              onClick={() => setCurrentPage(index)}
            />
          ))}
        </div>
      )}

      <div style={{ marginTop: '2rem', fontSize: '0.9rem', opacity: 0.6, lineHeight: '1.8', textAlign: 'center' }}>
        <div>Press <kbd style={{ padding: '2px 6px', background: 'transparent', border: '1px solid currentColor', borderRadius: '3px', fontFamily: 'monospace' }}>F</kbd> to toggle fullscreen.</div>
        <div>Use <kbd style={{ padding: '2px 6px', background: 'transparent', border: '1px solid currentColor', borderRadius: '3px', fontFamily: 'monospace' }}>Arrow Keys</kbd> or <kbd style={{ padding: '2px 6px', background: 'transparent', border: '1px solid currentColor', borderRadius: '3px', fontFamily: 'monospace' }}>Space</kbd> to navigate slides.</div>
        <div>Press <kbd style={{ padding: '2px 6px', background: 'transparent', border: '1px solid currentColor', borderRadius: '3px', fontFamily: 'monospace' }}>Esc</kbd> to exit fullscreen or return to selection.</div>
      </div>

      <AnimatePresence>
        {exportState && (
          <ExportProgress
            current={exportState.current}
            total={exportState.total}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default PresentationSelector
