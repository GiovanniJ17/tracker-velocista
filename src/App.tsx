import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [connectionStatus, setConnectionStatus] = useState('Sto controllando la connessione...')

  useEffect(() => {
    async function checkConnection() {
      // Prova a connettersi a Supabase
      const { data, error } = await supabase.from('training_sessions').select('*').limit(1)
      
      if (error) {
        setConnectionStatus('❌ Errore: ' + error.message)
      } else {
        setConnectionStatus('✅ Connesso al Database! Sistema pronto.')
      }
    }
    checkConnection()
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 font-sans">
      <div className="p-8 bg-white shadow-xl rounded-xl text-center">
        <h1 className="text-3xl font-bold text-blue-600 mb-4">
          Training Log
        </h1>
        <p className="text-lg text-gray-700 mb-6">
          {connectionStatus}
        </p>
        <button className="px-6 py-2 bg-red-500 text-white font-bold rounded hover:bg-red-600 transition">
          Pulsante Test Grafica
        </button>
      </div>
    </div>
  )
}

export default App