import { useState } from 'react'
import PresentationSelector from './components/PresentationSelector'
import PresentationViewer from './components/PresentationViewer'

function App() {
  const [selectedPresentation, setSelectedPresentation] = useState(null)

  return (
    <div className="app">
      {!selectedPresentation ? (
        <PresentationSelector onSelect={setSelectedPresentation} />
      ) : (
        <PresentationViewer
          presentation={selectedPresentation}
          onExit={() => setSelectedPresentation(null)}
        />
      )}
    </div>
  )
}

export default App
