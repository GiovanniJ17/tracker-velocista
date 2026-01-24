import { useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { PieChart as PieChartIcon, Target, Activity, CalendarDays } from 'lucide-react'
import { Card, CardBody } from '../ui/Card'
import { CHART_COLOR_ARRAY, RECHARTS_TOOLTIP_STYLE } from '../../constants/theme'

const COLORS = CHART_COLOR_ARRAY

/**
 * Session Distribution - pie chart + weekly heatmap.
 */
export default function SessionDistribution({
  distributionData,
  weeklyData,
  sessionFocus,
  onSessionFocusChange,
  chartWindowLabel
}) {
  if (!distributionData || distributionData.length === 0) return null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Pie Chart */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-4 h-4 text-pink-400" />
            <span className="text-sm font-medium text-white">Distribuzione Tipi</span>
          </div>
          <div className="w-full min-h-[220px] min-w-0">
            <ResponsiveContainer width="100%" height={220} minWidth={0}>
              <PieChart>
                <Pie
                  data={distributionData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={RECHARTS_TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>

      {/* Session Filter */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-teal-400" />
            <span className="text-sm font-medium text-white">Filtro Sessioni</span>
          </div>
          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-700/50">
                  <CalendarDays className="w-4 h-4 text-sky-300" />
                </div>
                <span>Vista</span>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">{chartWindowLabel}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-700/50">
                  <Target className="w-4 h-4 text-amber-300" />
                </div>
                <span>Focus</span>
              </div>
              <select
                value={sessionFocus}
                onChange={(e) => onSessionFocusChange(e.target.value)}
                className="px-2 py-1 min-h-[32px] bg-slate-800 border border-slate-700 rounded text-xs text-white"
              >
                <option value="all">Tutte</option>
                <option value="sprint">Solo sprint</option>
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Weekly Heatmap */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-white">Intensità Settimanale</span>
          </div>
          <div className="space-y-2">
            {weeklyData.slice(-8).map((week) => (
              <div key={week.week} className="flex items-center gap-3">
                <div className="w-16 text-xs font-mono text-slate-400">{week.week}</div>
                <div className="flex-1 h-6 bg-slate-700/50 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-orange-500 transition-all"
                    style={{ width: `${week.intensity}%` }}
                  />
                </div>
                <div className="text-xs font-semibold text-white w-12">{week.avgRPE} RPE</div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
