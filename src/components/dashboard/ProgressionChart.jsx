import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { TrendingUp, CalendarDays, Target } from 'lucide-react'
import { Card, CardBody } from '../ui/Card'
import { CHART_COLOR_ARRAY, RECHARTS_TOOLTIP_STYLE } from '../../constants/theme'
import { getProgressionChartData, getTargetTimeBands } from '../../services/statisticsService'

const COLORS = CHART_COLOR_ARRAY

/**
 * Progression Chart with filters and controls.
 */
export default function ProgressionChart({
  raceRecords,
  sessionTypeById = {},
  period,
  chartWindow,
  onChartWindowChange,
  endDate
}) {
  const [progressionFocus, setProgressionFocus] = useState('all')
  const [smoothProgression, setSmoothProgression] = useState(false)
  const [selectedDistances, setSelectedDistances] = useState([])
  const [manualTargets, setManualTargets] = useState({})

  // Get chart window start date
  const getChartWindowStart = useCallback(() => {
    if (chartWindow === 'period') return null
    const end = endDate || new Date()
    const days = chartWindow === '30d' ? 30 : 90
    return new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
  }, [chartWindow, endDate])

  // Filter records based on focus
  const baseProgressionRecords = useMemo(() => {
    const base = raceRecords.filter((record) => {
      const dateObj = new Date(record.date || record.created_at)
      return !Number.isNaN(dateObj.getTime())
    })
    if (progressionFocus === 'all') return base
    return base.filter((record) => {
      const sessionType = sessionTypeById[record.session_id]
      if (progressionFocus === 'races') {
        return sessionType === 'gara' || record.type === 'race'
      }
      if (progressionFocus === 'tests') {
        return sessionType === 'test' || record.is_test
      }
      return true
    })
  }, [progressionFocus, raceRecords, sessionTypeById])

  // Filter by chart window
  const chartRaceRecords = useMemo(() => {
    const start = getChartWindowStart()
    return baseProgressionRecords.filter((record) => {
      const dateObj = new Date(record.date || record.created_at)
      return !Number.isNaN(dateObj.getTime()) && (!start || dateObj >= start)
    })
  }, [baseProgressionRecords, getChartWindowStart])

  // Get chart data
  const chartProgressionData = useMemo(
    () => getProgressionChartData(chartRaceRecords),
    [chartRaceRecords]
  )

  // Smooth series
  const smoothSeries = useCallback((data, window = 3) => {
    if (!data.length) return data
    const keys = Object.keys(data[0]).filter((k) => k !== 'date')
    return data.map((row, index) => {
      const smoothed = { date: row.date }
      keys.forEach((key) => {
        const values = []
        for (let i = Math.max(0, index - window + 1); i <= index; i++) {
          const value = data[i]?.[key]
          if (typeof value === 'number') values.push(value)
        }
        if (values.length) {
          smoothed[key] = values.reduce((sum, v) => sum + v, 0) / values.length
        }
      })
      return smoothed
    })
  }, [])

  const displayedProgressionData = useMemo(
    () => (smoothProgression ? smoothSeries(chartProgressionData, 3) : chartProgressionData),
    [chartProgressionData, smoothProgression, smoothSeries]
  )

  // Available distances
  const chartAvailableDistances = useMemo(() => {
    const keys = new Set()
    chartProgressionData.forEach((d) => {
      Object.keys(d)
        .filter((k) => k !== 'date')
        .forEach((k) => keys.add(parseInt(k)))
    })
    return Array.from(keys).sort((a, b) => a - b)
  }, [chartProgressionData])

  // Initialize selected distances
  useEffect(() => {
    if (!chartAvailableDistances.length) return
    setSelectedDistances((prev) => {
      if (!prev.length) {
        const defaults = [60, 100, 200].filter((d) => chartAvailableDistances.includes(d))
        return defaults.length ? defaults : chartAvailableDistances
      }
      const next = prev.filter((d) => chartAvailableDistances.includes(d))
      return next.length ? next : chartAvailableDistances
    })
  }, [chartAvailableDistances])

  // Target times
  const sprintTargetBands = useMemo(
    () => getTargetTimeBands(raceRecords),
    [raceRecords]
  )

  const targetTimesByDistance = useMemo(() => {
    const map = {}
    sprintTargetBands.forEach((band) => {
      if (band.target_s) {
        map[band.distance_m] = band.target_s
      }
    })
    Object.entries(manualTargets).forEach(([distance, value]) => {
      const num = Number(value)
      if (!Number.isNaN(num) && num > 0) {
        map[Number(distance)] = num
      }
    })
    return map
  }, [sprintTargetBands, manualTargets])

  // Add goals to data
  const progressionDataWithGoals = useMemo(() => {
    if (!displayedProgressionData.length) return displayedProgressionData
    return displayedProgressionData.map((row) => {
      const withGoals = { ...row }
      selectedDistances.forEach((distance) => {
        const target = targetTimesByDistance[distance]
        if (target) {
          withGoals[`${distance}m_goal`] = target
        }
      })
      return withGoals
    })
  }, [displayedProgressionData, selectedDistances, targetTimesByDistance])

  const toggleDistance = (distance) => {
    setSelectedDistances((prev) => {
      if (prev.includes(distance)) {
        const next = prev.filter((d) => d !== distance)
        return next.length ? next : prev
      }
      return [...prev, distance].sort((a, b) => a - b)
    })
  }

  const showAllDistances = () => {
    setSelectedDistances(chartAvailableDistances)
  }

  const focusSprintDistances = () => {
    const defaults = [60, 100, 200].filter((d) => chartAvailableDistances.includes(d))
    setSelectedDistances(defaults.length ? defaults : chartAvailableDistances)
  }

  if (raceRecords.length === 0) return null

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-blue-400" />
        Progressione Tempi
      </h2>
      
      {/* Controls Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-white">Controlli Vista</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-12">Vista</span>
                <select
                  value={chartWindow}
                  onChange={(e) => onChartWindowChange(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white"
                >
                  <option value="period">Periodo</option>
                  <option value="30d">Ultimi 30g</option>
                  <option value="90d">Ultimi 90g</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-12">Focus</span>
                <select
                  value={progressionFocus}
                  onChange={(e) => setProgressionFocus(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white"
                >
                  <option value="all">Tutti i record</option>
                  <option value="races">Solo gare</option>
                  <option value="tests">Solo test</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSmoothProgression((prev) => !prev)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                    smoothProgression ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-slate-700 text-slate-300 border border-slate-600'
                  }`}
                >
                  {smoothProgression ? 'Smooth' : 'Raw'}
                </button>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-teal-400" />
              <span className="text-sm font-medium text-white">Distanze & Target</span>
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={focusSprintDistances}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-600"
                >
                  60/100/200
                </button>
                <button
                  type="button"
                  onClick={showAllDistances}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-600"
                >
                  Mostra tutte
                </button>
                {chartAvailableDistances.map((distance) => (
                  <button
                    key={distance}
                    type="button"
                    onClick={() => toggleDistance(distance)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      selectedDistances.includes(distance)
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                        : 'bg-slate-700 text-slate-300 border border-slate-600'
                    }`}
                  >
                    {distance}m
                  </button>
                ))}
              </div>
              {selectedDistances.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedDistances.map((distance) => (
                    <label key={`target-${distance}`} className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400">{distance}m</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder={targetTimesByDistance[distance] || ''}
                        value={manualTargets[distance] ?? ''}
                        onChange={(e) =>
                          setManualTargets((prev) => ({ ...prev, [distance]: e.target.value }))
                        }
                        className="w-16 px-2 py-1 bg-slate-800 border border-slate-600 rounded-lg text-xs text-white"
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardBody>
          <h3 className="text-sm font-medium text-white mb-4">Grafico Progressione</h3>
          <div className="w-full min-h-[300px] min-w-0">
            {chartProgressionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300} minWidth={0}>
                <LineChart data={progressionDataWithGoals} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#94a3b8" 
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />
                  <Tooltip contentStyle={RECHARTS_TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="line" />
                  {selectedDistances.map((dist, idx) => (
                    <Line
                      key={dist}
                      type="monotone"
                      dataKey={`${dist}m`}
                      stroke={COLORS[idx % COLORS.length]}
                      strokeWidth={2}
                      dot={{ fill: COLORS[idx % COLORS.length], r: 4, strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, strokeWidth: 2 }}
                      name={`${dist}m`}
                      animationDuration={1000}
                    />
                  ))}
                  {selectedDistances.map((dist, idx) =>
                    targetTimesByDistance[dist] ? (
                      <Line
                        key={`${dist}-goal`}
                        type="monotone"
                        dataKey={`${dist}m_goal`}
                        stroke={COLORS[idx % COLORS.length]}
                        strokeDasharray="4 4"
                        strokeOpacity={0.5}
                        dot={false}
                        name={`${dist}m target`}
                      />
                    ) : null
                  )}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-sm text-slate-400 bg-slate-800/40 border border-slate-700 rounded-lg gap-2">
                <div className="text-sm text-slate-300">
                  Nessun record per i filtri selezionati.
                </div>
                <div className="text-xs text-slate-500">
                  Prova a cambiare focus o periodo.
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setProgressionFocus('all')}
                    className="px-2 py-1 text-xs rounded bg-slate-800 border border-slate-700 text-slate-300"
                  >
                    Mostra tutti i record
                  </button>
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
