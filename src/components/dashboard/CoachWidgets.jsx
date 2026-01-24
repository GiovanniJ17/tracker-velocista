import { useState, useMemo, useEffect } from 'react'
import { Activity, TrendingUp } from 'lucide-react'
import { Card, CardHeader, CardBody } from '../ui/Card'
import Button from '../ui/Button'
import SectionTitle from '../ui/SectionTitle'
import {
  getWeeklyInsight,
  getWhatIfPrediction,
  getAdaptiveWorkoutSuggestion
} from '../../services/aiCoachService'

/**
 * Format seconds to mm:ss.cc or ss.cc format
 */
function formatSeconds(value) {
  if (value === null || value === undefined) return '-'
  const seconds = Number(value)
  if (Number.isNaN(seconds)) return '-'
  const mins = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(2)
  if (mins > 0) {
    return `${mins}:${secs.padStart(5, '0')}`
  }
  return `${secs}s`
}

/**
 * Parse time input from mm:ss or seconds format
 */
function parseTimeInput(value) {
  if (value === null || value === undefined) return null
  const text = String(value).trim()
  if (!text) return null
  if (text.includes(':')) {
    const [minsPart, secsPart] = text.split(':')
    const mins = Number(minsPart)
    const secs = Number(secsPart)
    if (Number.isNaN(mins) || Number.isNaN(secs)) return null
    return mins * 60 + secs
  }
  const numeric = Number(text)
  return Number.isNaN(numeric) ? null : numeric
}

/**
 * Coach Widgets - AI insight, What-if, Adaptive suggestion.
 */
export default function CoachWidgets({
  rawData,
  kpis,
  distanceOptions = [],
  pbOptions = []
}) {
  // AI Coach Insight state
  const [coachInsight, setCoachInsight] = useState(null)
  const [coachLoading, setCoachLoading] = useState(false)
  const [coachError, setCoachError] = useState(null)

  // What-if state
  const [whatIfInput, setWhatIfInput] = useState({
    targetDistance: null,
    baseMode: 'pb',
    pbKey: '',
    baseDistance: '',
    baseTime: ''
  })
  const [whatIfResult, setWhatIfResult] = useState(null)
  const [whatIfLoading, setWhatIfLoading] = useState(false)

  // Adaptive state
  const [adaptiveFocus, setAdaptiveFocus] = useState('')
  const [adaptiveResult, setAdaptiveResult] = useState(null)
  const [adaptiveLoading, setAdaptiveLoading] = useState(false)
  const [adaptiveError, setAdaptiveError] = useState(null)

  // Initialize what-if inputs
  useEffect(() => {
    if (!whatIfInput.targetDistance && distanceOptions.length) {
      setWhatIfInput((p) => ({ ...p, targetDistance: distanceOptions[0] }))
    }
  }, [distanceOptions, whatIfInput.targetDistance])

  useEffect(() => {
    if (whatIfInput.pbKey || !pbOptions.length) return
    const pb = pbOptions[0]
    setWhatIfInput((p) => ({
      ...p,
      pbKey: `${pb.distance_m}-${pb.time_s}`,
      baseDistance: pb.distance_m,
      baseTime: pb.time_s.toFixed(2)
    }))
  }, [pbOptions, whatIfInput.pbKey])

  const handleGenerateInsight = async () => {
    if (!rawData.sessions.length && !rawData.raceRecords.length) return
    setCoachLoading(true)
    setCoachError(null)
    setCoachInsight(null)
    const payload = {
      sessions: rawData.sessions,
      raceRecords: rawData.raceRecords,
      strengthRecords: rawData.strengthRecords,
      kpis: kpis || {}
    }
    const res = await getWeeklyInsight(payload)
    setCoachLoading(false)
    if (res.success) {
      setCoachInsight(res.data)
    } else {
      setCoachError(res.error)
    }
  }

  const handleWhatIf = async () => {
    const targetDistance = whatIfInput.targetDistance || distanceOptions[0]
    let baseDistance = whatIfInput.baseDistance
    let baseTime = parseTimeInput(whatIfInput.baseTime)

    if (whatIfInput.baseMode === 'pb' && whatIfInput.pbKey) {
      const [distPart, timePart] = whatIfInput.pbKey.split('-')
      baseDistance = Number(distPart)
      baseTime = Number(timePart)
    }

    if (!targetDistance) return
    setWhatIfLoading(true)
    const res = await getWhatIfPrediction({
      target_distance_m: targetDistance,
      base_distance_m: baseDistance,
      base_time_s: baseTime,
      recent_pbs: pbOptions
    })
    setWhatIfLoading(false)
    setWhatIfResult(res.success ? res.data : { error: res.error })
  }

  const handleAdaptiveSuggestion = async () => {
    if (!rawData.sessions.length) return
    setAdaptiveLoading(true)
    setAdaptiveError(null)
    const res = await getAdaptiveWorkoutSuggestion({
      recentSessions: rawData.sessions,
      upcomingFocus: adaptiveFocus,
      raceRecords: rawData.raceRecords
    })
    setAdaptiveLoading(false)
    if (res.success) {
      setAdaptiveResult(res.data)
    } else {
      setAdaptiveError(res.error)
    }
  }

  return (
    <div className="space-y-4">
      {/* AI Coach & What-if row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* AI Coach Insight */}
        <div className="lg:col-span-2">
          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-400" />
                  <span className="text-base font-semibold text-white">Insight Coach AI</span>
                </div>
                <Button
                  onClick={handleGenerateInsight}
                  disabled={!rawData.sessions.length && !rawData.raceRecords.length}
                  loading={coachLoading}
                  size="sm"
                >
                  {coachLoading ? 'Generazione...' : 'Genera Insight'}
                </Button>
              </div>
              <p className="text-sm text-slate-400 mb-4">Commento automatico sugli ultimi allenamenti</p>
              
              {coachError && (
                <div className="p-3 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl">
                  {coachError}
                </div>
              )}
              {coachInsight && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="text-xs text-emerald-300/70 mb-1 uppercase tracking-wider">Positivo</div>
                    <div className="text-slate-200">{coachInsight.positive}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div className="text-xs text-amber-300/70 mb-1 uppercase tracking-wider">Rischio</div>
                    <div className="text-slate-200">{coachInsight.warning}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <div className="text-xs text-blue-300/70 mb-1 uppercase tracking-wider">Focus</div>
                    <div className="text-slate-200">{coachInsight.advice}</div>
                  </div>
                </div>
              )}
              {!coachInsight && !coachLoading && !coachError && (
                <div className="p-4 text-sm text-slate-400 bg-slate-800/30 border border-slate-700 rounded-xl text-center">
                  Genera per ottenere un commento di sintesi.
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* What-if */}
        <Card color="pink">
          <CardHeader>
            <SectionTitle title="What-if Prestazione" icon={<TrendingUp className="w-5 h-5" />} />
          </CardHeader>
          <CardBody className="space-y-2 text-sm">
            <div>
              <label className="text-slate-400 text-xs">Distanza target</label>
              <select
                value={whatIfInput.targetDistance || distanceOptions[0] || ''}
                onChange={(e) =>
                  setWhatIfInput((p) => ({ ...p, targetDistance: parseInt(e.target.value) }))
                }
                className="w-full mt-1 px-3 py-2 min-h-[44px] bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
              >
                {distanceOptions.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}m
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-xs">Riferimento PB</label>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => {
                    const pb = pbOptions[0]
                    setWhatIfInput((p) => ({
                      ...p,
                      baseMode: 'pb',
                      pbKey: p.pbKey || (pb ? `${pb.distance_m}-${pb.time_s}` : ''),
                      baseDistance: p.baseDistance || (pb ? pb.distance_m : ''),
                      baseTime: p.baseTime || (pb ? pb.time_s.toFixed(2) : '')
                    }))
                  }}
                  className={`flex-1 px-3 py-2 min-h-[44px] rounded-lg text-sm ${
                    whatIfInput.baseMode === 'pb' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 border border-slate-600'
                  }`}
                >
                  Usa PB recente
                </button>
                <button
                  onClick={() => setWhatIfInput((p) => ({ ...p, baseMode: 'manual' }))}
                  className={`flex-1 px-3 py-2 min-h-[44px] rounded-lg text-sm ${
                    whatIfInput.baseMode === 'manual' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 border border-slate-600'
                  }`}
                >
                  Inserisci manuale
                </button>
              </div>
            </div>
            {whatIfInput.baseMode === 'pb' && (
              <div>
                <label className="text-slate-400 text-xs">PB recente</label>
                <select
                  value={whatIfInput.pbKey || ''}
                  onChange={(e) => {
                    const [distPart, timePart] = e.target.value.split('-')
                    setWhatIfInput((p) => ({
                      ...p,
                      pbKey: e.target.value,
                      baseDistance: Number(distPart),
                      baseTime: Number(timePart).toFixed(2)
                    }))
                  }}
                  className="w-full mt-1 px-3 py-2 min-h-[44px] bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
                >
                  {pbOptions.map((pb) => (
                    <option
                      key={`${pb.distance_m}-${pb.time_s}`}
                      value={`${pb.distance_m}-${pb.time_s}`}
                    >
                      {pb.distance_m}m - {formatSeconds(pb.time_s)}
                    </option>
                  ))}
                </select>
                {pbOptions.length === 0 && (
                  <div className="p-3 text-xs text-slate-500 bg-slate-800/40 border border-slate-700 rounded-lg mt-2">
                    Nessun PB disponibile, usa inserimento manuale.
                  </div>
                )}
              </div>
            )}
            {whatIfInput.baseMode === 'manual' && (
              <>
                <div>
                  <label className="text-slate-400 text-xs">Distanza riferimento (m)</label>
                  <input
                    type="number"
                    value={whatIfInput.baseDistance}
                    onChange={(e) =>
                      setWhatIfInput((p) => ({ ...p, baseDistance: e.target.value }))
                    }
                    className="w-full mt-1 px-3 py-2 min-h-[44px] bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
                    placeholder="Es. 100"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-xs">Tempo riferimento</label>
                  <input
                    type="text"
                    value={whatIfInput.baseTime}
                    onChange={(e) => setWhatIfInput((p) => ({ ...p, baseTime: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 min-h-[44px] bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
                    placeholder="Es. 11.24 oppure 0:11.24"
                  />
                </div>
              </>
            )}
            <Button
              onClick={handleWhatIf}
              disabled={!distanceOptions.length}
              loading={whatIfLoading}
              fullWidth
            >
              {whatIfLoading ? 'Calcolo...' : 'Stima tempo atteso'}
            </Button>
            {whatIfResult && (
              <div className="p-3 text-slate-200 text-sm space-y-1 bg-slate-700/50 border border-slate-600 rounded-lg">
                {whatIfResult.error && (
                  <div className="text-red-400 text-xs">{whatIfResult.error}</div>
                )}
                {whatIfResult.estimate_s !== undefined && (
                  <div>
                    <span className="text-slate-400">Stima:</span>{' '}
                    {formatSeconds(whatIfResult.estimate_s)} ({formatSeconds(whatIfResult.low_s)} -{' '}
                    {formatSeconds(whatIfResult.high_s)})
                  </div>
                )}
                {whatIfResult.explanation && (
                  <div>
                    <span className="text-slate-400">Spiegazione:</span> {whatIfResult.explanation}
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Adaptive Suggestion */}
      <Card color="green">
        <CardHeader className="flex items-center justify-between">
          <SectionTitle
            title="Adatta la prossima sessione"
            subtitle="Analizza stanchezza e tempi recenti"
          />
          <Button
            onClick={handleAdaptiveSuggestion}
            disabled={!rawData.sessions.length}
            loading={adaptiveLoading}
          >
            {adaptiveLoading ? 'Analisi...' : 'Suggerisci'}
          </Button>
        </CardHeader>
        <CardBody>
          <div className="space-y-2">
            <textarea
              value={adaptiveFocus}
              onChange={(e) => setAdaptiveFocus(e.target.value)}
              className="w-full h-24 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
              placeholder="Obiettivo o allenamento previsto (opzionale)"
            />
            {adaptiveError && (
              <div className="p-3 text-sm text-red-400 bg-red-900/30 border border-red-700 rounded-lg">
                {adaptiveError}
              </div>
            )}
            {adaptiveResult && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-slate-200">
                <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                  <div className="text-slate-400 text-xs uppercase">Segnale</div>
                  <div className="text-white mt-1">{adaptiveResult.signal}</div>
                </div>
                <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                  <div className="text-slate-400 text-xs uppercase">Suggerimento</div>
                  <div className="text-white mt-1">{adaptiveResult.suggestion}</div>
                </div>
                <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                  <div className="text-slate-400 text-xs uppercase">Recupero</div>
                  <div className="text-white mt-1">{adaptiveResult.recovery}</div>
                </div>
              </div>
            )}
            {!adaptiveResult && !adaptiveLoading && !adaptiveError && (
              <div className="p-4 text-sm text-slate-500 bg-slate-800/40 border border-slate-700 rounded-lg">
                Premi "Suggerisci" per un check rapido su carico e possibili modifiche.
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
