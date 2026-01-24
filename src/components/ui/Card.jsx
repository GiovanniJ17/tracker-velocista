import { forwardRef } from 'react'

/**
 * Card variants for different styles.
 * 'solid' - Default solid background card
 * 'stat' - Stat card with colored left border
 * 'panel' - Smaller panel variant
 */
const variantClasses = {
  solid: 'bg-slate-800/90 border border-slate-700/50 rounded-2xl p-5',
  stat: 'bg-slate-800/90 border border-slate-700/50 rounded-2xl p-5',
  panel: 'bg-slate-800/50 border border-slate-700/50 rounded-xl p-4',
  // Legacy alias
  glass: 'bg-slate-800/90 border border-slate-700/50 rounded-2xl p-5'
}

/**
 * Color variants for stat cards - maps to CSS classes for left border.
 */
const colorClasses = {
  yellow: 'border-l-4 border-l-yellow-400',
  orange: 'border-l-4 border-l-orange-500',
  green: 'border-l-4 border-l-emerald-500',
  purple: 'border-l-4 border-l-purple-500',
  teal: 'border-l-4 border-l-teal-500',
  blue: 'border-l-4 border-l-blue-500',
  red: 'border-l-4 border-l-red-500',
  pink: 'border-l-4 border-l-pink-500',
  cyan: 'border-l-4 border-l-cyan-500'
}

/**
 * Card component with solid backgrounds and optional color accents.
 * 
 * @param {Object} props
 * @param {'solid' | 'stat' | 'panel' | 'glass'} props.variant - Card style variant (default: solid)
 * @param {'yellow' | 'orange' | 'green' | 'purple' | 'teal' | 'blue' | 'red' | 'pink' | 'cyan'} props.color - Color accent for stat variant
 * @param {boolean} props.hover - Enable hover lift animation
 */
export const Card = forwardRef(function Card(
  {
    children,
    variant = 'solid',
    color,
    hover = false,
    shine = false, // Deprecated - kept for backward compatibility, does nothing
    className = '',
    ...props
  },
  ref
) {
  const classes = [
    variantClasses[variant] || variantClasses.solid,
    color && (variant === 'stat' || variant === 'solid') && colorClasses[color],
    hover && 'transition-transform duration-200 hover:-translate-y-1',
    className
  ].filter(Boolean).join(' ')
  
  return (
    <div ref={ref} className={classes} {...props}>
      {children}
    </div>
  )
})

/**
 * Card header section.
 */
export function CardHeader({ className = '', children, ...props }) {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  )
}

/**
 * Card body section.
 */
export function CardBody({ className = '', children, ...props }) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}

/**
 * Card footer section.
 */
export function CardFooter({ className = '', children, ...props }) {
  return (
    <div className={`mt-4 pt-4 border-t border-slate-700/50 ${className}`} {...props}>
      {children}
    </div>
  )
}

/**
 * Stat Card - pre-styled card for KPI display.
 * 
 * @param {Object} props
 * @param {'yellow' | 'orange' | 'green' | 'purple' | 'teal' | 'blue' | 'red' | 'pink' | 'cyan'} props.color
 * @param {string} props.label - Small label text
 * @param {string|number} props.value - Main value
 * @param {string} props.suffix - Text after value (e.g., "giorni")
 * @param {React.ReactNode} props.icon - Icon component
 */
export function StatCard({
  color = 'blue',
  label,
  value,
  suffix,
  icon,
  className = '',
  children,
  ...props
}) {
  return (
    <Card variant="stat" color={color} hover className={className} {...props}>
      <div className="flex items-start justify-between">
        <div>
          <div className="stat-label">{label}</div>
          <div className="flex items-baseline gap-2">
            <span className="stat-value">{value}</span>
            {suffix && <span className="text-sm text-slate-400">{suffix}</span>}
          </div>
          {children}
        </div>
        {icon && (
          <div className="stat-icon">
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}

export default Card
