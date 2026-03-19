import { useState, useEffect } from 'react'

function PresentationSelector({ onSelect }) {
  const [presentations, setPresentations] = useState([])

  useEffect(() => {
    // TODO: Load presentations from /presentations folder
    // For now, show placeholder
    setPresentations([
      { id: 'demo', name: 'Demo Presentation' }
    ])
  }, [])

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
              onClick={() => onSelect(presentation)}
            >
              {presentation.name}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default PresentationSelector
