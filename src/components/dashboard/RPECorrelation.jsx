import { useState, useMemo } from 'react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { Activity, LineChart as LineChartIcon } from 'lucide-react'
import { Card, CardHeader, CardBody } from '../ui/Card'
import SectionTitle from '../ui/SectionTitle'
import { RECHARTS_TOOLTIP_STYLE } from '../../constants/theme'

/**
 * RPE vs Performance Correlation scatter chart.
 */
export default function RPECorrelation({ data }) {
  const scatterDistances = useMemo(() => {
    const keys = new Set(data.map((d) => d.distance))
    return Array.from(keys).sort((a, b) => a - b)
  }, [data])

  const [selectedDistance, setSelectedDistance] = useState(() => 
    scatterDistances.length > 0 ? scatterDistances[0] : null
  )

  if (!data || data.length === 0 || !selectedDistance) return null

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card color="blue">
        <CardHeader>
          <SectionTitle title="RPE vs Tempo" icon={<Activity className="w-5 h-5" />} />
        </CardHeader>
        <CardBody className="flex flex-col gap-3 text-xs text-slate-300">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Distanza</div>
          {scatterDistances.length > 0 && (
            <select
              value={selectedDistance}
              onChange={(e) => setSelectedDistance(parseInt(e.target.value))}
              className="px-3 py-2 min-h-[44px] bg-slate-800 border border-slate-600 rounded-lg text-sm text-white"
            >
              {scatterDistances.map((dist) => (
                <option key={dist} value={dist}>
                  {dist}m
                </option>
              ))}
            </select>
          )}
          <div className="p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200">
            Scatter tra RPE e tempo per distanza selezionata.
          </div>
        </CardBody>
      </Card>
      <Card color="blue" className="lg:col-span-2">
        <CardHeader>
          <SectionTitle title="Grafico RPE" icon={<LineChartIcon className="w-5 h-5" />} />
        </CardHeader>
        <CardBody>
          <div className="w-full min-h-[200px] min-w-0">
            <ResponsiveContainer width="100%" height={200} minWidth={0}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  type="number"
                  dataKey="rpe"
                  name="RPE"
                  stroke="#94a3b8"
                  tick={{ fontSize: 11 }}
                  label={{ value: 'RPE', position: 'insideBottomRight', offset: -5, fill: '#94a3b8' }}
                />
                <YAxis
                  type="number"
                  dataKey="time"
                  name="Tempo"
                  stroke="#94a3b8"
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Secondi', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                />
                <Tooltip contentStyle={RECHARTS_TOOLTIP_STYLE} />
                <Scatter
                  data={data.filter((d) => d.distance === selectedDistance)}
                  fill="#3b82f6"
                  name={`${selectedDistance}m`}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
