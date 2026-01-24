import { Activity } from 'lucide-react'
import { Card, CardHeader, CardBody } from '../ui/Card'
import SectionTitle from '../ui/SectionTitle'

/**
 * Injury Timeline - shows injury history and recovery.
 */
export default function InjuryTimeline({ data }) {
  if (!data || data.length === 0) return null

  return (
    <Card color="pink">
      <CardHeader>
        <SectionTitle title="Timeline Infortuni" icon={<Activity className="w-5 h-5" />} />
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          {data.map((injury, idx) => (
            <div key={idx} className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-white">{injury.injury_type}</h3>
                  <p className="text-sm text-slate-400">{injury.body_part}</p>
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
              <div className="text-sm text-slate-400">
                {injury.start_date} → {injury.end_date || 'Attivo'} ({injury.duration} giorni)
              </div>
              <div className="text-sm text-slate-400 mt-1">
                Record durante infortunio: {injury.affectedRecords}
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}
