import { forwardRef } from 'react'

/**
 * Card variants for different styles.
 * 'glass' - Default glassmorphism card
 * 'solid' - Solid background without glass effect
 * 'stat' - Colorful stat card with glow
 */
const variantClasses = {
  glass: 'glass-card',
  solid: 'rounded-2xl border border-slate-700/50 bg-slate-800/80 p-5',
  stat: 'stat-card',
  panel: 'glass-panel'
}

/**
 * Color variants for stat cards - maps to CSS classes.
 */
const colorClasses = {
  yellow: 'stat-card-yellow',
  orange: 'stat-card-orange',
  green: 'stat-card-green',
  purple: 'stat-card-purple',
  teal: 'stat-card-teal',
  blue: 'stat-card-blue',
  red: 'stat-card-red',
  pink: 'stat-card-pink',
  cyan: 'stat-card-cyan'
}

/**
 * Card component with glassmorphism and color variant support.
 * 
 * @param {Object} props
 * @param {'glass' | 'solid' | 'stat' | 'panel'} props.variant - Card style variant
 * @param {'yellow' | 'orange' | 'green' | 'purple' | 'teal' | 'blue' | 'red' | 'pink' | 'cyan'} props.color - Color for stat variant
 * @param {boolean} props.hover - Enable hover animation
 * @param {boolean} props.shine - Enable shine effect on hover
 */
export const Card = forwardRef(function Card(
  {
    children,
    variant = 'glass',
    color,
    hover = false,
    shine = false,
    className = '',
    ...props
  },
  ref
) {
  const classes = [
    variantClasses[variant] || variantClasses.glass,
    color && variant === 'stat' && colorClasses[color],
    hover && 'transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
    shine && 'widget-shine',
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
    <div className={`mt-4 pt-4 border-t border-white/5 ${className}`} {...props}>
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
            {suffix && <span className="text-sm opacity-60">{suffix}</span>}
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
