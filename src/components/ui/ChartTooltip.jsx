import { RECHARTS_TOOLTIP_STYLE, CHART_COLORS } from '../../constants/theme'

/**
 * Custom tooltip component for Recharts that matches the app's design system.
 * Uses solid dark background with clean styling.
 */
export function ChartTooltip({ active, payload, label, formatter, labelFormatter }) {
  if (!active || !payload || !payload.length) {
    return null
  }

  const formattedLabel = labelFormatter ? labelFormatter(label) : label

  return (
    <div
      style={{
        ...RECHARTS_TOOLTIP_STYLE,
        minWidth: '140px'
      }}
    >
      {formattedLabel && (
        <p className="text-sm font-semibold text-white mb-2 pb-2 border-b border-slate-600">
          {formattedLabel}
        </p>
      )}
      <div className="space-y-1.5">
        {payload.map((entry, index) => {
          const value = formatter ? formatter(entry.value, entry.name, entry, index) : entry.value
          const displayValue = Array.isArray(value) ? value[0] : value
          
          return (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: entry.color || entry.stroke }}
                />
                <span className="text-xs text-slate-300">{entry.name}</span>
              </div>
              <span className="text-sm font-semibold text-white">{displayValue}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Minimal tooltip for simple charts.
 */
export function SimpleTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) {
    return null
  }

  return (
    <div
      style={{
        backgroundColor: '#1e293b',
        border: '1px solid #475569',
        borderRadius: '8px',
        padding: '8px 12px'
      }}
    >
      <p className="text-xs text-slate-300 mb-1">{label}</p>
      <p className="text-sm font-bold text-white">{payload[0]?.value}</p>
    </div>
  )
}

/**
 * Default tooltip styles for Recharts contentStyle prop.
 * Use this when you don't need a custom component.
 */
export const tooltipContentStyle = RECHARTS_TOOLTIP_STYLE

/**
 * Styled axis props for consistent chart styling.
 */
export const axisProps = {
  stroke: '#64748b',
  tick: { fill: '#94a3b8', fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: '#334155', strokeOpacity: 0.5 }
}

/**
 * Styled grid props for charts.
 */
export const gridProps = {
  strokeDasharray: '3 3',
  stroke: '#334155',
  strokeOpacity: 0.3,
  vertical: false
}

/**
 * Creates gradient definitions for area/line charts.
 * Usage: Place inside <defs> in your chart.
 */
export function ChartGradients({ colors = Object.values(CHART_COLORS) }) {
  return (
    <>
      {colors.map((color, index) => (
        <linearGradient
          key={`gradient-${index}`}
          id={`chartGradient-${index}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0.05} />
        </linearGradient>
      ))}
    </>
  )
}

export default ChartTooltip
