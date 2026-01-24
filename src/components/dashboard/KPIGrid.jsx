import { BarChart4, Activity, Trophy, Flame } from 'lucide-react'
import { StatCard } from '../ui/Card'

/**
 * Grid of 4 top-level KPI cards.
 */
export default function KPIGrid({ kpis }) {
  if (!kpis) return null
  
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <StatCard
        color="yellow"
        label="Sessioni"
        value={kpis.totalSessions}
        icon={<BarChart4 className="w-5 h-5 text-yellow-400" />}
      />
      <StatCard
        color="orange"
        label="RPE Medio"
        value={kpis.avgRPE}
        icon={<Activity className="w-5 h-5 text-orange-400" />}
      />
      <StatCard
        color="purple"
        label="Personal Best"
        value={kpis.pbCount}
        icon={<Trophy className="w-5 h-5 text-purple-400" />}
      />
      <StatCard
        color="green"
        label="Streak"
        value={kpis.streak}
        suffix="giorni"
        icon={<Flame className="w-5 h-5 text-emerald-400" />}
      />
    </div>
  )
}
