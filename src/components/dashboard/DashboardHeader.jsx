import { Download, BarChart4 } from 'lucide-react'
import Button from '../ui/Button'

/**
 * Dashboard header with title, period filter, and CSV export.
 */
export default function DashboardHeader({
  period,
  onPeriodChange,
  onExport
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <BarChart4 className="w-5 h-5 text-blue-400" />
          Statistiche Dettagliate
        </h1>
        <p className="text-sm text-slate-400 mt-1">Analisi approfondita delle tue performance</p>
      </div>
      <div className="flex items-center gap-3">
        <select
          value={period}
          onChange={(e) => onPeriodChange(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-xl text-sm text-white"
        >
          <option value="week">Ultima Settimana</option>
          <option value="month">Ultimo Mese</option>
          <option value="3months">Ultimi 3 Mesi</option>
          <option value="custom">Custom</option>
        </select>
        <Button onClick={onExport} icon={<Download className="w-4 h-4" />}>
          Esporta CSV
        </Button>
      </div>
    </div>
  )
}
