import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { LineChart as LineChartIcon } from 'lucide-react'
import { Card, CardHeader, CardBody } from '../ui/Card'
import SectionTitle from '../ui/SectionTitle'
import { RECHARTS_TOOLTIP_STYLE } from '../../constants/theme'

/**
 * Sprint Load Model chart - ATL/CTL/TSB.
 */
export default function SprintLoadChart({ data }) {
  if (!data || data.series.length < 7) return null
  
  return (
    <Card color="blue">
      <CardHeader>
        <SectionTitle
          title="Sprint Load (ATL/CTL/TSB)"
          subtitle="Solo sessioni sprint, modello carico forma"
          icon={<LineChartIcon className="w-5 h-5" />}
        />
      </CardHeader>
      <CardBody>
        <div className="w-full min-h-[200px] min-w-0">
          <ResponsiveContainer width="100%" height={200} minWidth={0}>
            <LineChart data={data.series.slice(-90)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={RECHARTS_TOOLTIP_STYLE} />
              <Legend />
              <Line type="monotone" dataKey="atl" stroke="#f59e0b" name="ATL" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="ctl" stroke="#10b981" name="CTL" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="tsb" stroke="#60a5fa" name="TSB" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {data.current && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-slate-200">
            <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <div className="text-slate-400 text-xs uppercase">ATL</div>
              <div className="text-white mt-1 text-lg font-semibold">
                {data.current.atl}
              </div>
            </div>
            <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <div className="text-slate-400 text-xs uppercase">CTL</div>
              <div className="text-white mt-1 text-lg font-semibold">
                {data.current.ctl}
              </div>
            </div>
            <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <div className="text-slate-400 text-xs uppercase">TSB</div>
              <div className="text-white mt-1 text-lg font-semibold">
                {data.current.tsb}
              </div>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
