import { useState } from 'react'
import { PlusCircle, BarChart3, Calendar, User, Zap } from 'lucide-react'
import AITrainingInput from './components/AITrainingInput'
import TrainingDashboard from './components/TrainingDashboard'
import SessionHistory from './components/History/SessionHistory'
import AthleteProfile from './components/AthleteProfile'

function App() {
  const [activeTab, setActiveTab] = useState('input')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const tabs = [
    { id: 'input', label: 'Inserimento', Icon: PlusCircle },
    { id: 'stats', label: 'Statistiche', Icon: BarChart3 },
    { id: 'history', label: 'Storico', Icon: Calendar },
    { id: 'profile', label: 'Profilo', Icon: User }
  ]

  const handleDataSaved = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <div className="min-h-screen text-white">
      {/* Background base gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 -z-20" />
      
      {/* Animated mesh background orbs */}
      <div className="mesh-background -z-10">
        <div className="mesh-orb mesh-orb-1" />
        <div className="mesh-orb mesh-orb-2" />
        <div className="mesh-orb mesh-orb-3" />
      </div>
      
      {/* Grain texture overlay */}
      <div className="grain-overlay" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-900/80 backdrop-blur-xl">
        <div className="app-shell py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">Training Log</h1>
                <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">Track & Field Performance Tracker</p>
              </div>
            </div>
            
            {/* Optional: Add user avatar or settings button here */}
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="app-shell py-3 sm:py-4">
        <nav className="glass-card p-1 sm:p-1.5">
          <div className="flex items-center gap-0.5 sm:gap-1">
            {tabs.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`nav-tab flex-1 justify-center py-2 sm:py-2.5 ${activeTab === id ? 'nav-tab-active' : ''}`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">{label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <main className="pb-8 sm:pb-12 animate-fade-in">
        {activeTab === 'input' && <AITrainingInput onDataSaved={handleDataSaved} />}
        {activeTab === 'stats' && <TrainingDashboard key={refreshTrigger} />}
        {activeTab === 'history' && <SessionHistory key={refreshTrigger} />}
        {activeTab === 'profile' && <AthleteProfile key={refreshTrigger} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-slate-900/40 backdrop-blur-sm py-4 sm:py-6">
        <div className="app-shell text-center">
          <p className="text-[10px] sm:text-xs text-slate-500">
            Training Log — Tracciamento intelligente allenamenti
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
