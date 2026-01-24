import { Activity, Flame, Timer, LineChart as LineChartIcon } from 'lucide-react'
import { Card, CardHeader, CardBody } from '../ui/Card'
import SectionTitle from '../ui/SectionTitle'

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
 * Format percentage with sign
 */
function formatPercent(value) {
  if (value === null || value === undefined) return '-'
  const num = Number(value)
  if (Number.isNaN(num)) return '-'
  return `${num > 0 ? '+' : ''}${num.toFixed(1)}%`
}

/**
 * Sprint Focus - snapshot on key distances and recent form.
 */
export default function SprintFocus({ data }) {
  if (!data || data.distanceRows.length === 0) return null
  
  return (
    <Card color="green">
      <CardHeader>
        <SectionTitle
          title="Focus Sprinter"
          subtitle="Snapshot su distanze chiave e forma recente"
          icon={<Activity className="w-5 h-5" />}
        />
      </CardHeader>
      <CardBody className="space-y-4">
        {/* Top metrics row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-slate-200">
          <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-600/50">
                <Flame className="w-4 h-4 text-rose-300" />
              </div>
              <div className="text-slate-400 text-xs uppercase">PB 30 giorni</div>
            </div>
            <div className="text-white mt-1 text-lg font-semibold">
              {data.pbCountLast30}
            </div>
          </div>
          <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-600/50">
                <Activity className="w-4 h-4 text-emerald-300" />
              </div>
              <div className="text-slate-400 text-xs uppercase">Sessioni Qualità</div>
            </div>
            <div className="text-white mt-1 text-lg font-semibold">
              {data.sessionQualityLast30}
            </div>
          </div>
          <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-600/50">
                <Activity className="w-4 h-4 text-amber-300" />
              </div>
              <div className="text-slate-400 text-xs uppercase">Top Speed stimata</div>
            </div>
            <div className="text-white mt-1 text-lg font-semibold">
              {data.topSpeedMps ? `${data.topSpeedMps.toFixed(2)} m/s` : '-'}
            </div>
          </div>
          <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-600/50">
                <LineChartIcon className="w-4 h-4 text-sky-300" />
              </div>
              <div className="text-slate-400 text-xs uppercase">Speed Endurance</div>
            </div>
            <div className="text-white mt-1 text-lg font-semibold">
              {data.speedEnduranceIndex
                ? data.speedEnduranceIndex.toFixed(2)
                : '-'}
            </div>
          </div>
        </div>

        {/* Distance rows grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.distanceRows.map((row) => (
            <div key={row.distance_m} className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 border-l-4 border-l-blue-500">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-600/50">
                  <Timer className="w-4 h-4 text-sky-300" />
                </div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">{row.distance_m}m</div>
              </div>
              <div className="flex flex-col gap-2 text-sm text-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Best</span>
                  <span className="text-white font-semibold">
                    {formatSeconds(row.best_time_s)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Recente</span>
                  <span className="text-white font-semibold">
                    {formatSeconds(row.recent_time_s)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Delta</span>
                  <span
                    className={`font-semibold ${
                      row.change_percent <= 0 ? 'text-green-400' : 'text-yellow-400'
                    }`}
                  >
                    {formatPercent(row.change_percent)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Trend 28g</span>
                  <span
                    className={`font-semibold ${
                      row.trend_percent !== null && row.trend_percent <= 0
                        ? 'text-green-400'
                        : 'text-yellow-400'
                    }`}
                  >
                    {formatPercent(row.trend_percent)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}
