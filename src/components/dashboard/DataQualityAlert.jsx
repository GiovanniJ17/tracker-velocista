import { Target } from 'lucide-react'
import { Card, CardHeader, CardBody } from '../ui/Card'
import SectionTitle from '../ui/SectionTitle'

/**
 * Data Quality Alert - shows potential data issues.
 */
export default function DataQualityAlert({ issues }) {
  if (!issues || issues.length === 0) return null
  
  return (
    <Card color="pink">
      <CardHeader>
        <SectionTitle title="Dati da verificare" subtitle="Possibili anomalie" icon={<Target className="w-5 h-5" />} />
      </CardHeader>
      <CardBody className="space-y-2 text-sm text-slate-200">
        {issues.map((issue) => (
          <div
            key={issue.id}
            className={`p-3 rounded-lg border ${
              issue.severity === 'warning'
                ? 'bg-amber-900/20 border-amber-700 text-amber-200'
                : 'bg-slate-800 border-slate-700'
            }`}
          >
            {issue.message}
          </div>
        ))}
      </CardBody>
    </Card>
  )
}
