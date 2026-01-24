/**
 * Theme constants for consistent styling across the application.
 * Clean Slate design - solid backgrounds, minimal effects.
 */

// Chart colors - flat solid hex codes
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

// Card color variants - solid backgrounds with colored left borders
export const CARD_VARIANTS = {
  yellow: {
    bg: '#1e293b',
    border: '#334155',
    accent: '#fbbf24',
    text: '#fbbf24',
    textMuted: 'rgba(251, 191, 36, 0.7)'
  },
  orange: {
    bg: '#1e293b',
    border: '#334155',
    accent: '#f97316',
    text: '#f97316',
    textMuted: 'rgba(249, 115, 22, 0.7)'
  },
  green: {
    bg: '#1e293b',
    border: '#334155',
    accent: '#10b981',
    text: '#10b981',
    textMuted: 'rgba(16, 185, 129, 0.7)'
  },
  purple: {
    bg: '#1e293b',
    border: '#334155',
    accent: '#a855f7',
    text: '#a855f7',
    textMuted: 'rgba(168, 85, 247, 0.7)'
  },
  teal: {
    bg: '#1e293b',
    border: '#334155',
    accent: '#14b8a6',
    text: '#14b8a6',
    textMuted: 'rgba(20, 184, 166, 0.7)'
  },
  blue: {
    bg: '#1e293b',
    border: '#334155',
    accent: '#3b82f6',
    text: '#3b82f6',
    textMuted: 'rgba(59, 130, 246, 0.7)'
  },
  red: {
    bg: '#1e293b',
    border: '#334155',
    accent: '#ef4444',
    text: '#ef4444',
    textMuted: 'rgba(239, 68, 68, 0.7)'
  },
  pink: {
    bg: '#1e293b',
    border: '#334155',
    accent: '#ec4899',
    text: '#ec4899',
    textMuted: 'rgba(236, 72, 153, 0.7)'
  },
  cyan: {
    bg: '#1e293b',
    border: '#334155',
    accent: '#06b6d4',
    text: '#06b6d4',
    textMuted: 'rgba(6, 182, 212, 0.7)'
  }
}

// Surface colors
export const SURFACE_COLORS = {
  card: '#1e293b',
  panel: '#1e293b',
  border: '#334155',
  background: '#0f172a'
}

// Tooltip style object for Recharts - solid, no glass effects
export const RECHARTS_TOOLTIP_STYLE = {
  backgroundColor: '#1e293b',
  border: '1px solid #475569',
  borderRadius: '8px',
  padding: '8px 12px'
}

// Animation durations
export const ANIMATION = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  chart: '1000ms'
}
