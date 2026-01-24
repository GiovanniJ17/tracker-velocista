/**
 * Theme constants for consistent styling across the application.
 * These values are designed to match the Tailwind config and provide
 * a single source of truth for chart colors, gradients, and effects.
 */

// Chart colors - used in Recharts and data visualizations
export const CHART_COLORS = {
  blue: '#3b82f6',
  green: '#10b981',
  yellow: '#f59e0b',
  red: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
  cyan: '#06b6d4',
  orange: '#f97316'
}

// Array version for easy iteration in charts
export const CHART_COLOR_ARRAY = [
  CHART_COLORS.blue,
  CHART_COLORS.green,
  CHART_COLORS.yellow,
  CHART_COLORS.red,
  CHART_COLORS.purple,
  CHART_COLORS.pink,
  CHART_COLORS.cyan,
  CHART_COLORS.orange
]

// Card color variants - backgrounds, borders, and shadows
export const CARD_VARIANTS = {
  yellow: {
    bg: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.08) 100%)',
    border: 'rgba(251, 191, 36, 0.25)',
    shadow: 'rgba(251, 191, 36, 0.15)',
    text: '#fbbf24',
    textMuted: 'rgba(251, 191, 36, 0.7)'
  },
  orange: {
    bg: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(234, 88, 12, 0.08) 100%)',
    border: 'rgba(249, 115, 22, 0.25)',
    shadow: 'rgba(249, 115, 22, 0.15)',
    text: '#f97316',
    textMuted: 'rgba(249, 115, 22, 0.7)'
  },
  green: {
    bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)',
    border: 'rgba(16, 185, 129, 0.25)',
    shadow: 'rgba(16, 185, 129, 0.15)',
    text: '#10b981',
    textMuted: 'rgba(16, 185, 129, 0.7)'
  },
  purple: {
    bg: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(139, 92, 246, 0.08) 100%)',
    border: 'rgba(168, 85, 247, 0.25)',
    shadow: 'rgba(168, 85, 247, 0.15)',
    text: '#a855f7',
    textMuted: 'rgba(168, 85, 247, 0.7)'
  },
  teal: {
    bg: 'linear-gradient(135deg, rgba(20, 184, 166, 0.15) 0%, rgba(13, 148, 136, 0.08) 100%)',
    border: 'rgba(20, 184, 166, 0.25)',
    shadow: 'rgba(20, 184, 166, 0.15)',
    text: '#14b8a6',
    textMuted: 'rgba(20, 184, 166, 0.7)'
  },
  blue: {
    bg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.08) 100%)',
    border: 'rgba(59, 130, 246, 0.25)',
    shadow: 'rgba(59, 130, 246, 0.15)',
    text: '#3b82f6',
    textMuted: 'rgba(59, 130, 246, 0.7)'
  },
  red: {
    bg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.08) 100%)',
    border: 'rgba(239, 68, 68, 0.25)',
    shadow: 'rgba(239, 68, 68, 0.15)',
    text: '#ef4444',
    textMuted: 'rgba(239, 68, 68, 0.7)'
  },
  pink: {
    bg: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(219, 39, 119, 0.08) 100%)',
    border: 'rgba(236, 72, 153, 0.25)',
    shadow: 'rgba(236, 72, 153, 0.15)',
    text: '#ec4899',
    textMuted: 'rgba(236, 72, 153, 0.7)'
  },
  cyan: {
    bg: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(8, 145, 178, 0.08) 100%)',
    border: 'rgba(6, 182, 212, 0.25)',
    shadow: 'rgba(6, 182, 212, 0.15)',
    text: '#06b6d4',
    textMuted: 'rgba(6, 182, 212, 0.7)'
  }
}

// Glass morphism presets
export const GLASS_EFFECTS = {
  card: {
    background: 'rgba(15, 23, 42, 0.6)',
    backdropBlur: '20px',
    border: 'rgba(255, 255, 255, 0.08)'
  },
  panel: {
    background: 'rgba(30, 41, 59, 0.5)',
    backdropBlur: '12px',
    border: 'rgba(255, 255, 255, 0.05)'
  },
  tooltip: {
    background: 'rgba(15, 23, 42, 0.95)',
    backdropBlur: '16px',
    border: 'rgba(59, 130, 246, 0.3)'
  }
}

// Tooltip style object for Recharts
export const RECHARTS_TOOLTIP_STYLE = {
  backgroundColor: GLASS_EFFECTS.tooltip.background,
  border: `1px solid ${GLASS_EFFECTS.tooltip.border}`,
  borderRadius: '12px',
  backdropFilter: `blur(${GLASS_EFFECTS.tooltip.backdropBlur})`,
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
  padding: '12px 16px'
}

// Common gradients
export const GRADIENTS = {
  primary: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
  success: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
  danger: 'linear-gradient(135deg, #ef4444 0%, #f43f5e 100%)',
  warning: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
  purple: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%)'
}

// Animation durations
export const ANIMATION = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  chart: '1000ms'
}
