import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  LineChart,
  Line,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart
} from 'recharts'
import { Download, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import {
  getStatsData,
  calculateKPIs,
  getProgressionChartData,
  getWeeklyHeatmapData,
  getSessionTypeDistribution,
  getRPEPerformanceCorrelation,
  getInjuryTimeline,
  getMonthlyMetrics,
  exportToCSV
} from '../services/statisticsService'
import {
  getWeeklyInsight,
  getWhatIfPrediction,
  getAdaptiveWorkoutSuggestion
} from '../services/aiCoachService'
import { generateProactiveAlerts } from '../services/proactiveCoach'
import CoachAlerts from './CoachAlerts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function TrainingDashboard() {
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('3months') // 'week', 'month', '3months', 'custom'
  const [startDate, _setStartDate] = useState(null)
  const [endDate, _setEndDate] = useState(null)
  const [kpis, setKpis] = useState(null)
  const [progressionData, setProgressionData] = useState([])
  const [weeklyData, setWeeklyData] = useState([])
  const [distributionData, setDistributionData] = useState([])
  const [scatterData, setScatterData] = useState([])
  const [injuryTimeline, setInjuryTimeline] = useState([])
  const [monthlyMetrics, setMonthlyMetrics] = useState([])
  const [selectedDistance, setSelectedDistance] = useState(null)
  const [rawData, setRawData] = useState({
    sessions: [],
    raceRecords: [],
    trainingRecords: [],
    strengthRecords: [],
    injuries: []
  })
  const [coachInsight, setCoachInsight] = useState(null)
  const [coachLoading, setCoachLoading] = useState(false)
  const [coachError, setCoachError] = useState(null)
  const [whatIfInput, setWhatIfInput] = useState({
    targetDistance: null,
    baseMode: 'pb',
    pbKey: '',
    baseDistance: '',
    baseTime: ''
  })
  const [whatIfResult, setWhatIfResult] = useState(null)
  const [whatIfLoading, setWhatIfLoading] = useState(false)
  const [adaptiveFocus, setAdaptiveFocus] = useState('')
  const [adaptiveResult, setAdaptiveResult] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [adaptiveLoading, setAdaptiveLoading] = useState(false)
  const [adaptiveError, setAdaptiveError] = useState(null)

  const loadDashboardData = useCallback(async () => {
    setLoading(true)

    // Calcola date in base al period
    const end = endDate || new Date()
    let start = startDate

    if (!start) {
      switch (period) {
        case 'week':
          start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case '3months':
          start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        default:
          start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000)
      }
    }

    const result = await getStatsData(start, end)

    if (result.success) {
      const { sessions, raceRecords, trainingRecords, strengthRecords, injuries } = result.data
      setRawData({ sessions, raceRecords, trainingRecords, strengthRecords, injuries })

      // Calcola tutte le metriche
      const kpisCalc = calculateKPIs(sessions, raceRecords, strengthRecords, trainingRecords)
      setKpis(kpisCalc)

      const progression = getProgressionChartData(raceRecords)
      setProgressionData(progression)

      const weekly = getWeeklyHeatmapData(sessions)
      setWeeklyData(weekly)

      const distribution = getSessionTypeDistribution(sessions)
      setDistributionData(distribution)

      const scatter = getRPEPerformanceCorrelation(sessions, raceRecords)
      setScatterData(scatter)

      const injuryTl = getInjuryTimeline(injuries, raceRecords)
      setInjuryTimeline(injuryTl)

      const monthly = getMonthlyMetrics(sessions, raceRecords)
      setMonthlyMetrics(monthly)

      // Genera gli alert proattivi del coach
      try {
        const detectedAlerts = await generateProactiveAlerts(
          sessions,
          raceRecords,
          strengthRecords,
          trainingRecords,
          injuries
        )
        setAlerts(detectedAlerts || [])
      } catch (err) {
        console.error('Errore generazione alert:', err)
        setAlerts([])
      }
    }

    setLoading(false)
  }, [endDate, period, startDate])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const availableDistances = useMemo(() => {
    const keys = new Set()
    progressionData.forEach((d) => {
      Object.keys(d)
        .filter((k) => k !== 'date')
        .forEach((k) => keys.add(parseInt(k)))
    })
    return Array.from(keys).sort((a, b) => a - b)
  }, [progressionData])

  const distanceOptions = useMemo(() => {
    const distances = new Set(availableDistances)
    rawData.raceRecords.forEach((r) => {
      if (r.distance_m) distances.add(Number(r.distance_m))
    })
    return Array.from(distances).sort((a, b) => a - b)
  }, [availableDistances, rawData.raceRecords])

  const pbOptions = useMemo(() => {
    const pbs = rawData.raceRecords
      .filter((r) => r.is_personal_best && r.distance_m && r.time_s)
      .sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at))
      .slice(0, 8)
      .map((r) => ({
        distance_m: Number(r.distance_m),
        time_s: Number(r.time_s),
        date: r.date || r.created_at
      }))

    if (pbs.length) return pbs

    const bestByDistance = {}
    rawData.raceRecords.forEach((r) => {
      if (!r.distance_m || !r.time_s) return
      const distance = Number(r.distance_m)
      const time = Number(r.time_s)
      if (!bestByDistance[distance] || time < bestByDistance[distance].time_s) {
        bestByDistance[distance] = {
          distance_m: distance,
          time_s: time,
          date: r.date || r.created_at
        }
      }
    })
    return Object.values(bestByDistance).sort((a, b) => a.distance_m - b.distance_m)
  }, [rawData.raceRecords])

  const scatterDistances = useMemo(() => {
    const keys = new Set(scatterData.map((d) => d.distance))
    return Array.from(keys).sort((a, b) => a - b)
  }, [scatterData])

  useEffect(() => {
    if (availableDistances.length === 0) return
    setSelectedDistance((prev) =>
      prev && availableDistances.includes(prev) ? prev : availableDistances[0]
    )
  }, [availableDistances])

  useEffect(() => {
    if (scatterDistances.length === 0) return
    setSelectedDistance((prev) =>
      prev && scatterDistances.includes(prev) ? prev : scatterDistances[0]
    )
  }, [scatterDistances])

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

  const handleExportCSV = () => {
    exportToCSV(
      rawData.sessions,
      rawData.raceRecords,
      `training-stats-${format(new Date(), 'yyyy-MM-dd')}.csv`
    )
  }

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

  const parseTimeInput = (value) => {
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

  const formatSeconds = (value) => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-400">Caricamento statistiche...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header con filtri */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">📊 Statistiche Dettagliate</h1>
          <p className="text-gray-400">Analisi approfondita delle tue performance</p>
        </div>
        <div className="flex gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
          >
            <option value="week">Ultima Settimana</option>
            <option value="month">Ultimo Mese</option>
            <option value="3months">Ultimi 3 Mesi</option>
            <option value="custom">Custom</option>
          </select>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Esporta CSV
          </button>
        </div>
      </div>

      {/* Proactive Alerts */}
      {alerts.length > 0 && <CoachAlerts alerts={alerts} loading={false} />}

      {/* Coach AI & What-if */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-white">Insight Coach AI</h2>
              <p className="text-sm text-gray-400">Commento automatico sugli ultimi allenamenti</p>
            </div>
            <button
              onClick={handleGenerateInsight}
              disabled={coachLoading || (!rawData.sessions.length && !rawData.raceRecords.length)}
              className="px-3 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg text-sm"
            >
              {coachLoading ? 'Generazione...' : 'Genera Insight'}
            </button>
          </div>
          {coachError && <div className="text-sm text-red-400">{coachError}</div>}
          {coachInsight && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-200">
              <div className="p-3 bg-slate-700 rounded-lg border border-slate-600">
                <div className="text-gray-400 text-xs uppercase">Positivo</div>
                <div className="text-white mt-1">{coachInsight.positive}</div>
              </div>
              <div className="p-3 bg-slate-700 rounded-lg border border-slate-600">
                <div className="text-gray-400 text-xs uppercase">Rischio</div>
                <div className="text-white mt-1">{coachInsight.warning}</div>
              </div>
              <div className="p-3 bg-slate-700 rounded-lg border border-slate-600">
                <div className="text-gray-400 text-xs uppercase">Focus</div>
                <div className="text-white mt-1">{coachInsight.advice}</div>
              </div>
            </div>
          )}
          {!coachInsight && !coachLoading && !coachError && (
            <div className="text-sm text-gray-500">Genera per ottenere un commento di sintesi.</div>
          )}
        </div>

        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <h2 className="text-lg font-bold text-white mb-2">What-if Prestazione</h2>
          <div className="space-y-2 text-sm">
            <div>
              <label className="text-gray-400 text-xs">Distanza target</label>
              <select
                value={whatIfInput.targetDistance || distanceOptions[0] || ''}
                onChange={(e) =>
                  setWhatIfInput((p) => ({ ...p, targetDistance: parseInt(e.target.value) }))
                }
                className="w-full mt-1 px-2 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
              >
                {distanceOptions.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}m
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-xs">Riferimento PB</label>
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
                  className={`flex-1 px-3 py-2 rounded-lg text-xs ${whatIfInput.baseMode === 'pb' ? 'bg-primary-600 text-white' : 'bg-slate-700 text-gray-300 border border-slate-600'}`}
                >
                  Usa PB recente
                </button>
                <button
                  onClick={() => setWhatIfInput((p) => ({ ...p, baseMode: 'manual' }))}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs ${whatIfInput.baseMode === 'manual' ? 'bg-primary-600 text-white' : 'bg-slate-700 text-gray-300 border border-slate-600'}`}
                >
                  Inserisci manuale
                </button>
              </div>
            </div>
            {whatIfInput.baseMode === 'pb' && (
              <div>
                <label className="text-gray-400 text-xs">PB recente</label>
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
                  className="w-full mt-1 px-2 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
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
                  <div className="text-xs text-gray-500 mt-1">
                    Nessun PB disponibile, usa inserimento manuale.
                  </div>
                )}
              </div>
            )}
            {whatIfInput.baseMode === 'manual' && (
              <>
                <div>
                  <label className="text-gray-400 text-xs">Distanza riferimento (m)</label>
                  <input
                    type="number"
                    value={whatIfInput.baseDistance}
                    onChange={(e) =>
                      setWhatIfInput((p) => ({ ...p, baseDistance: e.target.value }))
                    }
                    className="w-full mt-1 px-2 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                    placeholder="Es. 100"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs">Tempo riferimento</label>
                  <input
                    type="text"
                    value={whatIfInput.baseTime}
                    onChange={(e) => setWhatIfInput((p) => ({ ...p, baseTime: e.target.value }))}
                    className="w-full mt-1 px-2 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                    placeholder="Es. 11.24 oppure 0:11.24"
                  />
                </div>
              </>
            )}
            <button
              onClick={handleWhatIf}
              disabled={whatIfLoading || !distanceOptions.length}
              className="w-full px-3 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg text-sm"
            >
              {whatIfLoading ? 'Calcolo...' : 'Stima tempo atteso'}
            </button>
            {whatIfResult && (
              <div className="text-gray-200 text-sm space-y-1 bg-slate-700 border border-slate-600 rounded p-2">
                {whatIfResult.error && (
                  <div className="text-red-400 text-xs">{whatIfResult.error}</div>
                )}
                {whatIfResult.estimate_s !== undefined && (
                  <div>
                    <span className="text-gray-400">Stima:</span>{' '}
                    {formatSeconds(whatIfResult.estimate_s)} ({formatSeconds(whatIfResult.low_s)} -{' '}
                    {formatSeconds(whatIfResult.high_s)})
                  </div>
                )}
                {whatIfResult.explanation && (
                  <div>
                    <span className="text-gray-400">Spiegazione:</span> {whatIfResult.explanation}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="text-gray-400 text-sm mb-2">Sessioni</div>
            <div className="text-3xl font-bold text-primary-400">{kpis.totalSessions}</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="text-gray-400 text-sm mb-2">RPE Medio</div>
            <div className="text-3xl font-bold text-green-400">{kpis.avgRPE}</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="text-gray-400 text-sm mb-2">Personal Best</div>
            <div className="text-3xl font-bold text-yellow-400">{kpis.pbCount}</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="text-gray-400 text-sm mb-2">Streak 🔥</div>
            <div className="text-3xl font-bold text-red-400">{kpis.streak} giorni</div>
          </div>
        </div>
      )}

      {/* Progressione Tempi */}
      {progressionData.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Progressione Tempi
            </h2>
            {availableDistances.length > 0 && (
              <div className="text-xs text-gray-400">
                Distanze: {availableDistances.join(', ')}m
              </div>
            )}
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={progressionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
              <Legend />
              {availableDistances.map((dist, idx) => (
                <Line
                  key={dist}
                  type="monotone"
                  dataKey={`${dist}m`}
                  stroke={COLORS[idx % COLORS.length]}
                  dot={{ fill: COLORS[idx % COLORS.length] }}
                  strokeWidth={2}
                  name={`${dist}m`}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Sessioni per tipo */}
      {distributionData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">Distribuzione Tipi Allenamento</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={distributionData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Heatmap Settimanale */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">Intensità Settimanale</h2>
            <div className="space-y-2">
              {weeklyData.slice(-8).map((week) => (
                <div key={week.week} className="flex items-center gap-3">
                  <div className="w-20 text-sm font-mono text-gray-400">{week.week}</div>
                  <div className="flex-1 h-8 bg-slate-700 rounded overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-red-500 transition-all"
                      style={{ width: `${week.intensity}%` }}
                    />
                  </div>
                  <div className="text-sm font-bold text-white">{week.avgRPE} RPE</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* RPE vs Performance */}
      {scatterData.length > 0 && selectedDistance && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Correlazione RPE vs Tempo</h2>
            {scatterDistances.length > 0 && (
              <select
                value={selectedDistance}
                onChange={(e) => setSelectedDistance(parseInt(e.target.value))}
                className="px-3 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-white"
              >
                {scatterDistances.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}m
                  </option>
                ))}
              </select>
            )}
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                type="number"
                dataKey="rpe"
                name="RPE"
                stroke="#94a3b8"
                label={{ value: 'RPE', position: 'insideBottomRight', offset: -5 }}
              />
              <YAxis
                type="number"
                dataKey="time"
                name="Tempo"
                stroke="#94a3b8"
                label={{ value: 'Secondi', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
              <Scatter
                data={scatterData.filter((d) => d.distance === selectedDistance)}
                fill="#3b82f6"
                name={`${selectedDistance}m`}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Metriche Mensili */}
      {monthlyMetrics.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4">Trend Mensile</h2>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={monthlyMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
              <Legend />
              <Bar dataKey="count" fill="#3b82f6" name="Sessioni" />
              <Line type="monotone" dataKey="avg" stroke="#10b981" name="Tempo Medio" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Timeline Infortuni */}
      {injuryTimeline.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4">🏥 Timeline Infortuni</h2>
          <div className="space-y-4">
            {injuryTimeline.map((injury, idx) => (
              <div key={idx} className="p-4 bg-slate-700 rounded-lg border border-slate-600">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-white">{injury.injury_type}</h3>
                    <p className="text-sm text-gray-400">{injury.body_part}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-sm font-bold ${
                      injury.severity === 'minor'
                        ? 'bg-yellow-600'
                        : injury.severity === 'moderate'
                          ? 'bg-orange-600'
                          : 'bg-red-600'
                    } text-white`}
                  >
                    {injury.severity}
                  </span>
                </div>
                <div className="text-sm text-gray-400">
                  {injury.start_date} → {injury.end_date || 'Attivo'} ({injury.duration} giorni)
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  Record durante infortunio: {injury.affectedRecords}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggerimento Adattivo AI */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold text-white">Adatta la prossima sessione</h2>
            <p className="text-sm text-gray-400">Analizza stanchezza e tempi recenti</p>
          </div>
          <button
            onClick={handleAdaptiveSuggestion}
            disabled={adaptiveLoading || !rawData.sessions.length}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg text-sm"
          >
            {adaptiveLoading ? 'Analisi...' : 'Suggerisci'}
          </button>
        </div>
        <div className="space-y-2">
          <textarea
            value={adaptiveFocus}
            onChange={(e) => setAdaptiveFocus(e.target.value)}
            className="w-full h-20 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
            placeholder="Obiettivo o allenamento previsto (opzionale)"
          />
          {adaptiveError && <div className="text-sm text-red-400">{adaptiveError}</div>}
          {adaptiveResult && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-200">
              <div className="p-3 bg-slate-700 rounded-lg border border-slate-600">
                <div className="text-gray-400 text-xs uppercase">Segnale</div>
                <div className="text-white mt-1">{adaptiveResult.signal}</div>
              </div>
              <div className="p-3 bg-slate-700 rounded-lg border border-slate-600">
                <div className="text-gray-400 text-xs uppercase">Suggerimento</div>
                <div className="text-white mt-1">{adaptiveResult.suggestion}</div>
              </div>
              <div className="p-3 bg-slate-700 rounded-lg border border-slate-600">
                <div className="text-gray-400 text-xs uppercase">Recupero</div>
                <div className="text-white mt-1">{adaptiveResult.recovery}</div>
              </div>
            </div>
          )}
          {!adaptiveResult && !adaptiveLoading && !adaptiveError && (
            <div className="text-sm text-gray-500">
              Premi "Suggerisci" per un check rapido su carico e possibili modifiche.
            </div>
          )}
        </div>
      </div>

      {/* Empty State */}
      {progressionData.length === 0 && (
        <div className="bg-slate-800 rounded-xl p-12 border border-slate-700 text-center">
          <p className="text-gray-400 text-lg">
            Nessun dato disponibile per il periodo selezionato
          </p>
        </div>
      )}
    </div>
  )
}
