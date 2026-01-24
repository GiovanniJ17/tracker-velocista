import { Activity, Target, Timer, LineChart as LineChartIcon } from 'lucide-react'
import { Card, CardHeader, CardBody } from '../ui/Card'
import SectionTitle from '../ui/SectionTitle'

/**
 * Sprint Metrics - velocity, acceleration, speed endurance, consistency.
 */
export default function SprintMetrics({ data }) {
  if (!data) return null
  
  const hasMetrics = data.maxVelocityMps ||
    data.accelIndex !== null ||
    data.speedEndurance200 !== null ||
    [60, 100, 200].some(d => data.consistencyByDistance?.[d] !== null)
  
  if (!hasMetrics) return null
  
  return (
    <Card color="orange">
      <CardHeader>
        <SectionTitle title="Metriche Sprinter" subtitle="Velocità, riserva e consistenza" icon={<LineChartIcon className="w-5 h-5" />} />
      </CardHeader>
      <CardBody className="space-y-4 text-sm text-slate-200">
        {/* Top metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-600/50">
                <Activity className="w-4 h-4 text-sky-300" />
              </div>
              <div className="text-slate-400 text-xs uppercase">Max velocity</div>
            </div>
            <div className="text-white mt-1 text-lg font-semibold">
              {data.maxVelocityMps
                ? `${data.maxVelocityMps.toFixed(2)} m/s`
                : '-'}
            </div>
          </div>
          <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-600/50">
                <Target className="w-4 h-4 text-amber-300" />
              </div>
              <div className="text-slate-400 text-xs uppercase">Accel index (30/60)</div>
            </div>
            <div className="text-white mt-1 text-lg font-semibold">
              {data.accelIndex ?? '-'}
            </div>
          </div>
          <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-600/50">
                <LineChartIcon className="w-4 h-4 text-emerald-300" />
              </div>
              <div className="text-slate-400 text-xs uppercase">Speed Endurance</div>
            </div>
            <div className="text-white mt-1 text-lg font-semibold">
              {data.speedEndurance200 ?? '-'} (200/100)
            </div>
          </div>
        </div>

        {/* Consistency by distance */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[60, 100, 200].map((distance) => (
            <div
              key={distance}
              className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-600/50">
                  <Timer className="w-4 h-4 text-sky-300" />
                </div>
                <div className="text-slate-400 text-xs uppercase">{distance}m consistency</div>
              </div>
              <div className="mt-1 text-white font-semibold">
                {data.consistencyByDistance?.[distance] !== null
                  ? `${data.consistencyByDistance[distance].toFixed(2)}s`
                  : '-'}
              </div>
              <div className="text-slate-400 text-xs">Std dev ultimi 8 risultati</div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}
