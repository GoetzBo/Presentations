import { useState, useEffect } from 'react'
import { loadPresentations } from '../utils/loadPresentations'

function PresentationSelector({ onSelect }) {
  const [presentations, setPresentations] = useState([])

  useEffect(() => {
    loadPresentations()
      .then(setPresentations)
      .catch(error => {
        console.error('Failed to load presentations:', error)
        setPresentations([])
      })
  }, [])

  const enterFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen()
    }
  }

  return (
    <div className="selector">
      <h1>Presentations</h1>
      <div className="presentation-list">
        {presentations.length === 0 ? (
          <div className="presentation-item" style={{ cursor: 'default' }}>
            No presentations found
          </div>
        ) : (
          presentations.map((presentation) => (
            <div
              key={presentation.id}
              className="presentation-item"
              onClick={() => {
                enterFullscreen()
                onSelect(presentation)
              }}
            >
              {presentation.name}
            </div>
          ))
        )}
      </div>
      <div style={{ marginTop: '2rem', fontSize: '0.9rem', opacity: 0.6, lineHeight: '1.8', textAlign: 'center' }}>
        <div>Press <kbd style={{ padding: '2px 6px', background: 'transparent', border: '1px solid currentColor', borderRadius: '3px', fontFamily: 'monospace' }}>F</kbd> to toggle fullscreen.</div>
        <div>Use <kbd style={{ padding: '2px 6px', background: 'transparent', border: '1px solid currentColor', borderRadius: '3px', fontFamily: 'monospace' }}>Arrow Keys</kbd> or <kbd style={{ padding: '2px 6px', background: 'transparent', border: '1px solid currentColor', borderRadius: '3px', fontFamily: 'monospace' }}>Space</kbd> to navigate slides.</div>
        <div>Press <kbd style={{ padding: '2px 6px', background: 'transparent', border: '1px solid currentColor', borderRadius: '3px', fontFamily: 'monospace' }}>Esc</kbd> to exit fullscreen or return to selection.</div>
      </div>
    </div>
  )
}

export default PresentationSelector
