import { Target } from 'lucide-react'
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
 * Target Time Bands - estimated times for 100/200/400m.
 */
export default function TargetTimeBands({ data }) {
  if (!data || !data.some(band => band.target_s)) return null
  
  return (
    <Card color="orange">
      <CardHeader>
        <SectionTitle title="Target Time Bands" subtitle="Stima 100/200/400m (ultimi 120g)" icon={<Target className="w-5 h-5" />} />
      </CardHeader>
      <CardBody className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-slate-200">
        {data.map((band) => (
          <div
            key={band.distance_m}
            className="p-4 bg-slate-700/50 rounded-lg border border-slate-600"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-600/50">
                <Target className="w-4 h-4 text-sky-300" />
              </div>
              <div className="text-slate-400 text-xs uppercase">{band.distance_m}m</div>
            </div>
            {band.target_s ? (
              <>
                <div className="mt-1 text-lg font-semibold">
                  {formatSeconds(band.target_s)}
                </div>
                <div className="text-slate-400 text-xs">
                  Range: {formatSeconds(band.low_s)} - {formatSeconds(band.high_s)}
                </div>
                <div className="text-slate-400 text-xs">Sample: {band.samples}</div>
              </>
            ) : (
              <div className="mt-2 text-slate-500 text-xs leading-relaxed">
                Corri almeno 3 sessioni sui {band.distance_m}m per sbloccare questa analisi
              </div>
            )}
          </div>
        ))}
      </CardBody>
    </Card>
  )
}
