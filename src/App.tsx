import { Header } from './components/Header'
import { PieceTable } from './components/PieceInput/PieceTable'
import { SettingsPanel } from './components/Settings/SettingsPanel'
import { ResultsPanel } from './components/Results/ResultsPanel'
import { SawView } from './components/Results/SawView'
import { EmptyState } from './components/EmptyState'
import { useAppStore } from './store/useAppStore'
import { useAutoOptimize } from './hooks/useAutoOptimize'

function App() {
  const pieces = useAppStore((s) => s.pieces)
  const addPiece = useAppStore((s) => s.addPiece)

  useAutoOptimize()

  const showEmptyState = pieces.length === 0

  return (
    <div className="min-h-screen bg-bg font-sans">
      <Header />

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4 md:max-w-2xl">
        {/* Settings (collapsible) */}
        <SettingsPanel />

        {/* Empty state or input */}
        {showEmptyState ? (
          <EmptyState onManual={addPiece} />
        ) : (
          <PieceTable />
        )}

        {/* Results */}
        <ResultsPanel />
      </main>

      {/* Full-screen saw view overlay */}
      <SawView />
    </div>
  )
}

export default App
