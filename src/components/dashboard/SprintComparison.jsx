import { CalendarDays } from 'lucide-react'
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
 * Sprint Period Comparison - 4-week vs previous 4-week.
 */
export default function SprintComparison({ data }) {
  if (!data || data.current.sessions + data.previous.sessions < 2) return null
  
  return (
    <Card color="green">
      <CardHeader>
        <SectionTitle title="Confronto Sprint 4 settimane" icon={<CalendarDays className="w-5 h-5" />} />
      </CardHeader>
      <CardBody className="space-y-4 text-sm text-slate-200">
        {/* Period comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <div className="text-slate-400 text-xs uppercase">Ultime 4 settimane</div>
            <div className="mt-2 space-y-1">
              <div>Sessioni: {data.current.sessions}</div>
              <div>Distanza sprint: {data.current.distance_m} m</div>
              <div>RPE medio: {data.current.avg_rpe ?? '-'}</div>
              <div>Load sprint: {data.current.load}</div>
              <div>PB: {data.current.pb_count}</div>
            </div>
          </div>
          <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <div className="text-slate-400 text-xs uppercase">4 settimane precedenti</div>
            <div className="mt-2 space-y-1">
              <div>Sessioni: {data.previous.sessions}</div>
              <div>Distanza sprint: {data.previous.distance_m} m</div>
              <div>RPE medio: {data.previous.avg_rpe ?? '-'}</div>
              <div>Load sprint: {data.previous.load}</div>
              <div>PB: {data.previous.pb_count}</div>
            </div>
          </div>
        </div>

        {/* Delta metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs text-slate-200">
          <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
            <div className="text-slate-400 uppercase">Sessioni</div>
            <div className="mt-1 font-semibold">{formatPercent(data.delta.sessions)}</div>
          </div>
          <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
            <div className="text-slate-400 uppercase">Distanza</div>
            <div className="mt-1 font-semibold">{formatPercent(data.delta.distance_m)}</div>
          </div>
          <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
            <div className="text-slate-400 uppercase">RPE</div>
            <div className="mt-1 font-semibold">{formatPercent(data.delta.avg_rpe)}</div>
          </div>
          <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
            <div className="text-slate-400 uppercase">Load</div>
            <div className="mt-1 font-semibold">{formatPercent(data.delta.load)}</div>
          </div>
          <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
            <div className="text-slate-400 uppercase">PB</div>
            <div className="mt-1 font-semibold">{formatPercent(data.delta.pb_count)}</div>
          </div>
        </div>

        {/* Best by distance */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[100, 200, 400].map((distance) => (
            <div
              key={distance}
              className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg"
            >
              <div className="text-slate-400 text-xs uppercase">{distance}m best</div>
              <div className="mt-1 font-semibold">
                {data.current.bestByDistance?.[distance]
                  ? formatSeconds(data.current.bestByDistance[distance])
                  : '-'}
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}
