import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { Trash2, MapPin } from 'lucide-react'

export default function SessionDetail({ date, sessions, onDelete, loading }) {
  const getTypeColor = (type) => {
    const colors = {
      pista: 'bg-blue-500',
      palestra: 'bg-purple-500',
      strada: 'bg-green-500',
      gara: 'bg-red-500',
      test: 'bg-yellow-500',
      scarico: 'bg-cyan-500',
      recupero: 'bg-teal-500',
      altro: 'bg-gray-500'
    }
    return colors[type] || 'bg-gray-500'
  }

  const typeLabels = {
    pista: 'Pista',
    palestra: 'Palestra',
    strada: 'Strada',
    gara: 'Gara',
    test: 'Test',
    scarico: 'Scarico',
    recupero: 'Recupero',
    altro: 'Altro'
  }

  const buildDisplayTitle = (session) => {
    const firstNoteLine = session.notes?.split('\n')?.[0]?.trim()
    return firstNoteLine || ''
  }

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
        <p className="text-gray-400">Caricamento...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-white mb-4">
        {format(date, 'd MMMM yyyy', { locale: it })}
      </h3>

      {sessions.length === 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
          <p className="text-gray-400">Nessuna sessione registrata per questo giorno</p>
        </div>
      ) : (
        sessions.map((session) => (
          <div
            key={session.id}
            className="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-slate-600 transition"
          >
            {/* Header Sessione */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 flex-1">
                <div
                  className={`${getTypeColor(session.type)} px-3 py-1 rounded-full text-white text-sm font-medium`}
                >
                  {typeLabels[session.type] || session.type}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">{buildDisplayTitle(session)}</h4>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onDelete(session.id)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition text-red-400 hover:text-red-300"
                  title="Elimina"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-slate-700">
              {session.rpe !== null && (
                <div>
                  <p className="text-xs text-gray-500 uppercase">RPE</p>
                  <p className="text-lg font-bold text-white">{session.rpe}/10</p>
                </div>
              )}
              {session.location && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Luogo</p>
                    <p className="text-sm text-white">{session.location}</p>
                  </div>
                </div>
              )}
              {session.feeling && (
                <div>
                  <p className="text-xs text-gray-500 uppercase">Condizione</p>
                  <p className="text-sm text-white">{session.feeling}</p>
                </div>
              )}
            </div>

            {/* Note */}
            {session.notes && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 uppercase mb-2">Note</p>
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{session.notes}</p>
              </div>
            )}

            {/* Gruppi ed esercizi */}
            {session.groups && session.groups.length > 0 ? (
              <div className="space-y-3">
                {session.groups.map((group) => (
                  <div
                    key={group.id}
                    className="bg-slate-900/60 border border-slate-700 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-white">{group.name || 'Gruppo'}</p>
                      {group.notes && <p className="text-xs text-gray-400">{group.notes}</p>}
                    </div>
                    {group.sets && group.sets.length > 0 ? (
                      <div className="space-y-2">
                        {group.sets.map((set) => (
                          <div
                            key={set.id}
                            className="flex flex-wrap items-center gap-3 text-sm text-gray-200"
                          >
                            <span className="font-semibold">{set.exercise_name}</span>
                            {set.sets && <span className="text-gray-400">{set.sets}x</span>}
                            {set.reps && <span className="text-gray-400">{set.reps} rep</span>}
                            {set.weight_kg && (
                              <span className="text-gray-400">{set.weight_kg} kg</span>
                            )}
                            {set.distance_m && (
                              <span className="text-gray-400">{set.distance_m} m</span>
                            )}
                            {set.time_s && <span className="text-gray-400">{set.time_s}s</span>}
                            {set.recovery_s && (
                              <span className="text-gray-500">rec {set.recovery_s}s</span>
                            )}
                            {set.notes && <span className="text-gray-300">• {set.notes}</span>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">Nessun esercizio registrato.</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-500">
                Esercizi non ancora caricati nel dettaglio
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
