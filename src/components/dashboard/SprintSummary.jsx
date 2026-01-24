import { Timer, Trophy, Activity, Flame } from 'lucide-react'
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
 * Sprint Summary - 5 key sprint numbers.
 */
export default function SprintSummary({ data }) {
  if (!data || data.distanceRows.length === 0) return null
  
  return (
    <Card color="blue">
      <CardHeader>
        <SectionTitle title="Sprint Summary" subtitle="I 5 numeri chiave" icon={<Trophy className="w-5 h-5" />} />
      </CardHeader>
      <CardBody className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 lg:grid-cols-5 sm:overflow-visible text-sm text-slate-200 scrollbar-thin">
        {/* Recent 60/100/200 */}
        <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 min-w-[160px] flex-shrink-0 sm:min-w-0 sm:flex-shrink">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-600/50">
              <Timer className="w-4 h-4 text-sky-300" />
            </div>
            <div className="text-slate-400 text-xs uppercase">Recenti 60/100/200</div>
          </div>
          <div className="flex flex-col gap-1 text-sm mt-2">
            <span>60m: <span className="text-white font-semibold">{formatSeconds(data.sprintMetrics?.recentBestByDistance?.[60])}</span></span>
            <span>100m: <span className="text-white font-semibold">{formatSeconds(data.sprintMetrics?.recentBestByDistance?.[100])}</span></span>
            <span>200m: <span className="text-white font-semibold">{formatSeconds(data.sprintMetrics?.recentBestByDistance?.[200])}</span></span>
          </div>
        </div>

        {/* Best 100m */}
        <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 min-w-[140px] flex-shrink-0 sm:min-w-0 sm:flex-shrink">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-600/50">
              <Trophy className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="text-slate-400 text-xs uppercase">Best 100m</div>
          </div>
          <div className="text-white mt-2 text-lg font-semibold">
            {data.sprintMetrics?.bestTimes?.[100]
              ? formatSeconds(data.sprintMetrics.bestTimes[100])
              : '-'}
          </div>
        </div>

        {/* Top Speed */}
        <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 min-w-[140px] flex-shrink-0 sm:min-w-0 sm:flex-shrink">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-600/50">
              <Activity className="w-4 h-4 text-amber-300" />
            </div>
            <div className="text-slate-400 text-xs uppercase">Top speed</div>
          </div>
          <div className="text-white mt-2 text-lg font-semibold">
            {data.topSpeedMps
              ? `${data.topSpeedMps.toFixed(2)} m/s`
              : '-'}
          </div>
        </div>

        {/* Best 200m */}
        <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 min-w-[140px] flex-shrink-0 sm:min-w-0 sm:flex-shrink">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-600/50">
              <Trophy className="w-4 h-4 text-sky-300" />
            </div>
            <div className="text-slate-400 text-xs uppercase">Best 200m</div>
          </div>
          <div className="text-white mt-2 text-lg font-semibold">
            {data.sprintMetrics?.bestTimes?.[200]
              ? formatSeconds(data.sprintMetrics.bestTimes[200])
              : '-'}
          </div>
        </div>

        {/* PB 30 days */}
        <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 min-w-[140px] flex-shrink-0 sm:min-w-0 sm:flex-shrink">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-600/50">
              <Flame className="w-4 h-4 text-rose-300" />
            </div>
            <div className="text-slate-400 text-xs uppercase">PB 30 giorni</div>
          </div>
          <div className="text-white mt-2 text-lg font-semibold">
            {data.pbCountLast30}
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
