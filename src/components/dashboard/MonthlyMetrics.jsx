import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { CalendarDays, LineChart as LineChartIcon } from 'lucide-react'
import { Card, CardHeader, CardBody } from '../ui/Card'
import SectionTitle from '../ui/SectionTitle'
import { RECHARTS_TOOLTIP_STYLE } from '../../constants/theme'

/**
 * Monthly Metrics - sessions count and average time.
 */
export default function MonthlyMetrics({
  data,
  sessionFocus,
  onSessionFocusChange,
  chartWindowLabel
}) {
  if (!data || data.length === 0) return null

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card color="orange">
        <CardHeader>
          <SectionTitle title="Trend Mensile" icon={<CalendarDays className="w-5 h-5" />} />
        </CardHeader>
        <CardBody className="flex flex-col gap-3 text-xs text-slate-300">
          <div className="flex items-center justify-between gap-2">
            <span>Vista</span>
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">{chartWindowLabel}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span>Focus</span>
            <select
              value={sessionFocus}
              onChange={(e) => onSessionFocusChange(e.target.value)}
              className="px-2 py-1 min-h-[32px] bg-slate-800 border border-slate-700 rounded text-xs text-white"
            >
              <option value="all">Tutte</option>
              <option value="sprint">Solo sprint</option>
            </select>
          </div>
        </CardBody>
      </Card>
      <Card color="orange" className="lg:col-span-2">
        <CardHeader>
          <SectionTitle title="Grafico Mensile" icon={<LineChartIcon className="w-5 h-5" />} />
        </CardHeader>
        <CardBody>
          <div className="w-full min-h-[200px] min-w-0">
            <ResponsiveContainer width="100%" height={200} minWidth={0}>
              <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={RECHARTS_TOOLTIP_STYLE} />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" name="Sessioni" />
                <Line type="monotone" dataKey="avg" stroke="#10b981" name="Tempo Medio" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
