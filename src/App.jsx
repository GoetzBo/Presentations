import { useState, useEffect } from 'react'
import PresentationSelector from './components/PresentationSelector'
import PresentationViewer from './components/PresentationViewer'
import { loadConfig } from './utils/loadPresentations'
import { ConfigContext } from './context/ConfigContext'

function App() {
  const [selectedPresentation, setSelectedPresentation] = useState(null)
  const [config, setConfig] = useState(null)

  useEffect(() => {
    loadConfig().then(setConfig)
  }, [])

  if (!config) return null

  return (
    <ConfigContext.Provider value={config}>
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
    </ConfigContext.Provider>
  )
}

export default App
