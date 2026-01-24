import { useState, useEffect, useMemo, useCallback } from 'react'
import { format } from 'date-fns'
import { BarChart4 } from 'lucide-react'
import {
  getStatsData,
  calculateKPIs,
  getWeeklyHeatmapData,
  getSessionTypeDistribution,
  getRPEPerformanceCorrelation,
  getInjuryTimeline,
  getMonthlyMetrics,
  getSprintLoadModel,
  getSprintPeriodComparison,
  getTargetTimeBands,
  getSprintDataQuality,
  getSprinterSummary,
  exportToCSV
} from '../services/statisticsService'
import { generateProactiveAlerts } from '../services/proactiveCoach'
import CoachAlerts from './CoachAlerts'
import LoadingSpinner from './LoadingSpinner'
import { Card, CardBody } from './ui/Card'
import EmptyState from './ui/EmptyState'

// Dashboard sub-components
import {
  DashboardHeader,
  KPIGrid,
  SprintSummary,
  SprintFocus,
  SprintMetrics,
  SprintLoadChart,
  SprintComparison,
  TargetTimeBands,
  DataQualityAlert,
  ProgressionChart,
  SessionDistribution,
  CoachWidgets,
  RPECorrelation,
  MonthlyMetrics,
  InjuryTimeline
} from './dashboard'

export default function TrainingDashboard() {
  // Main state
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('3months')
  const [chartWindow, setChartWindow] = useState('period')
  const [sessionFocus, setSessionFocus] = useState('all')
  const [startDate, _setStartDate] = useState(null)
  const [endDate, _setEndDate] = useState(null)
  
  // Data state
  const [kpis, setKpis] = useState(null)
  const [weeklyData, setWeeklyData] = useState([])
  const [distributionData, setDistributionData] = useState([])
  const [scatterData, setScatterData] = useState([])
  const [injuryTimeline, setInjuryTimeline] = useState([])
  const [monthlyMetrics, setMonthlyMetrics] = useState([])
  const [rawData, setRawData] = useState({
    sessions: [],
    raceRecords: [],
    trainingRecords: [],
    strengthRecords: [],
    injuries: []
  })
  const [alerts, setAlerts] = useState([])

  // Calculate period dates
  const periodDates = useMemo(() => {
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
    return { start, end }
  }, [period, startDate, endDate])

  // Computed sprint data
  const sprintLoadModel = useMemo(() => getSprintLoadModel(rawData.sessions), [rawData.sessions])
  const sprintComparison = useMemo(
    () => getSprintPeriodComparison(rawData.sessions, rawData.raceRecords, periodDates.start, periodDates.end),
    [rawData.raceRecords, rawData.sessions, periodDates]
  )
  const sprintTargetBands = useMemo(
    () => getTargetTimeBands(rawData.raceRecords),
    [rawData.raceRecords]
  )
  const sprinterSummary = useMemo(
    () => getSprinterSummary(rawData.sessions, rawData.raceRecords),
    [rawData.raceRecords, rawData.sessions]
  )
  const sprintDataQuality = useMemo(
    () => getSprintDataQuality(rawData.sessions, rawData.raceRecords, sprinterSummary),
    [rawData.raceRecords, rawData.sessions, sprinterSummary]
  )

  // Session type lookup
  const sessionTypeById = useMemo(() => {
    const map = {}
    rawData.sessions.forEach((session) => {
      map[session.id] = session.type || null
    })
    return map
  }, [rawData.sessions])

  // Check if sprint session
  const isSprintSession = useCallback((session) => {
    if (session?.type === 'pista' || session?.type === 'gara' || session?.type === 'test') {
      return true
    }
    return (session.workout_groups || []).some((group) =>
      (group.workout_sets || []).some((set) => set.category === 'sprint' || set.category === 'jump')
    )
  }, [])

  // Get chart window start
  const getChartWindowStart = useCallback(() => {
    if (chartWindow === 'period') return null
    const end = endDate || new Date()
    const days = chartWindow === '30d' ? 30 : 90
    return new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
  }, [chartWindow, endDate])

  // Filter sessions for charts
  const chartSessions = useMemo(() => {
    const start = getChartWindowStart()
    const base = rawData.sessions.filter((session) => {
      const dateObj = new Date(session.date)
      return !Number.isNaN(dateObj.getTime()) && (!start || dateObj >= start)
    })
    if (sessionFocus === 'sprint') {
      return base.filter((session) => isSprintSession(session))
    }
    return base
  }, [rawData.sessions, getChartWindowStart, sessionFocus, isSprintSession])

  // Chart data computed from filtered sessions
  const chartWeeklyData = useMemo(
    () => getWeeklyHeatmapData(chartSessions),
    [chartSessions]
  )
  const chartDistributionData = useMemo(
    () => getSessionTypeDistribution(chartSessions),
    [chartSessions]
  )
  const chartMonthlyMetrics = useMemo(() => {
    const start = getChartWindowStart()
    const chartRaceRecords = rawData.raceRecords.filter((record) => {
      const dateObj = new Date(record.date || record.created_at)
      return !Number.isNaN(dateObj.getTime()) && (!start || dateObj >= start)
    })
    return getMonthlyMetrics(chartSessions, chartRaceRecords)
  }, [chartSessions, rawData.raceRecords, getChartWindowStart])

  const chartWindowLabel =
    chartWindow === 'period' ? 'Periodo' : chartWindow === '30d' ? '30g' : '90g'

  // Feature flags
  const hasSprintSummary = sprinterSummary.distanceRows.length > 0
  const hasSprintLoad = sprintLoadModel.series.length >= 7
  const hasSprintComparison =
    sprintComparison.current.sessions + sprintComparison.previous.sessions >= 2
  const hasSprintMetrics =
    sprinterSummary.sprintMetrics &&
    (sprinterSummary.sprintMetrics.maxVelocityMps ||
      sprinterSummary.sprintMetrics.accelIndex !== null ||
      sprinterSummary.sprintMetrics.speedEndurance200 !== null ||
      [60, 100, 200].some(
        (distance) => sprinterSummary.sprintMetrics.consistencyByDistance?.[distance] !== null
      ))

  // Distance options for What-if
  const distanceOptions = useMemo(() => {
    const distances = new Set()
    rawData.raceRecords.forEach((r) => {
      if (r.distance_m) distances.add(Number(r.distance_m))
    })
    return Array.from(distances).sort((a, b) => a - b)
  }, [rawData.raceRecords])

  // PB options for What-if
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

  // Data loading
  const loadDashboardData = useCallback(async () => {
    setLoading(true)

    const end = endDate || new Date()
    let periodStart = startDate

    if (!periodStart) {
      switch (period) {
        case 'week':
          periodStart = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          periodStart = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case '3months':
          periodStart = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        default:
          periodStart = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000)
      }
    }

    // Calculate max data range needed
    let dataStart = periodStart
    const chartWindowDays = chartWindow === '90d' ? 90 : chartWindow === '30d' ? 30 : 0
    const periodDays = Math.ceil((end.getTime() - periodStart.getTime()) / (24 * 60 * 60 * 1000))
    const maxNeededDays = Math.max(periodDays * 2, chartWindowDays, 180)
    
    const fetchStart = new Date(end.getTime() - maxNeededDays * 24 * 60 * 60 * 1000)
    if (fetchStart < dataStart) {
      dataStart = fetchStart
    }

    const result = await getStatsData(dataStart, end)

    if (result.success) {
      const { sessions, raceRecords, trainingRecords, strengthRecords, injuries } = result.data
      setRawData({ sessions, raceRecords, trainingRecords, strengthRecords, injuries })

      const kpisCalc = calculateKPIs(sessions, raceRecords, strengthRecords, trainingRecords)
      setKpis(kpisCalc)

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

      // Generate proactive alerts
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
  }, [endDate, period, startDate, chartWindow])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // CSV export handler
  const handleExportCSV = () => {
    exportToCSV(
      rawData.sessions,
      rawData.raceRecords,
      `training-stats-${format(new Date(), 'yyyy-MM-dd')}.csv`
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner message="Caricamento statistiche..." />
      </div>
    )
  }

  return (
    <div className="app-shell py-4 space-y-6 animate-pop">
      {/* Header */}
      <DashboardHeader
        period={period}
        onPeriodChange={setPeriod}
        onExport={handleExportCSV}
      />

      {/* Proactive Alerts */}
      {alerts.length > 0 && <CoachAlerts alerts={alerts} loading={false} />}

      {/* Coach AI & What-if */}
      <CoachWidgets
        rawData={rawData}
        kpis={kpis}
        distanceOptions={distanceOptions}
        pbOptions={pbOptions}
      />

      {/* KPI Grid */}
      <KPIGrid kpis={kpis} />

      {/* Sprint Summary */}
      {hasSprintSummary && <SprintSummary data={sprinterSummary} />}

      {/* Sprint Focus */}
      {hasSprintSummary && <SprintFocus data={sprinterSummary} />}

      {/* Sprint Metrics */}
      {hasSprintMetrics && <SprintMetrics data={sprinterSummary.sprintMetrics} />}

      {/* Data Quality Alerts */}
      {sprintDataQuality.issues.length > 0 && (
        <DataQualityAlert issues={sprintDataQuality.issues} />
      )}

      {/* Sprint Load Chart */}
      {hasSprintLoad && <SprintLoadChart data={sprintLoadModel} />}

      {/* Sprint Comparison */}
      {hasSprintComparison && <SprintComparison data={sprintComparison} />}

      {/* Target Time Bands */}
      {sprintTargetBands.some((band) => band.target_s) && (
        <TargetTimeBands data={sprintTargetBands} />
      )}

      {/* Progression Chart */}
      {rawData.raceRecords.length > 0 && (
        <ProgressionChart
          raceRecords={rawData.raceRecords}
          sessionTypeById={sessionTypeById}
          period={period}
          chartWindow={chartWindow}
          onChartWindowChange={setChartWindow}
          endDate={endDate}
        />
      )}

      {/* Session Distribution */}
      {chartDistributionData.length > 0 && (
        <SessionDistribution
          distributionData={chartDistributionData}
          weeklyData={chartWeeklyData}
          sessionFocus={sessionFocus}
          onSessionFocusChange={setSessionFocus}
          chartWindowLabel={chartWindowLabel}
        />
      )}

      {/* RPE Correlation */}
      {scatterData.length > 0 && <RPECorrelation data={scatterData} />}

      {/* Monthly Metrics */}
      {chartMonthlyMetrics.length > 0 && (
        <MonthlyMetrics
          data={chartMonthlyMetrics}
          sessionFocus={sessionFocus}
          onSessionFocusChange={setSessionFocus}
          chartWindowLabel={chartWindowLabel}
        />
      )}

      {/* Injury Timeline */}
      {injuryTimeline.length > 0 && <InjuryTimeline data={injuryTimeline} />}

      {/* Empty State */}
      {rawData.raceRecords.length === 0 && (
        <Card color="blue" className="text-center">
          <CardBody className="py-10 sm:py-12">
            <EmptyState
              icon={<BarChart4 className="w-6 h-6 text-blue-300" />}
              title="Nessun dato disponibile per il periodo selezionato"
              description="Prova ad allargare il periodo o inserire nuovi allenamenti."
            />
          </CardBody>
        </Card>
      )}
    </div>
  )
}
