import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { getCoachAdvice } from '../aiLogic';

// --- ICONS ---
const Icons = {
  Run: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  Dumbbell: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Clock: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Fire: () => <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.45-.412-1.725a1 1 0 10-1.997-.077c-.023.46.105 1.285.45 2.06.336.756.88 1.48 1.63 2.052.748.57 1.69.932 2.66.932 1.64 0 3.016-1.025 3.56-2.536 1.41-3.918 2.747-6.953 2.747-6.953a1 1 0 00-1.398-1.221 34.14 34.14 0 01-3.998 1.547zM8.868 15.378A5.002 5.002 0 0115 16h3a1 1 0 10-1.472-1.39 3.003 3.003 0 00-2.31 1.77 5.004 5.004 0 00-5.35-1.002z" clipRule="evenodd" /></svg>,
  Trophy: () => <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.699-3.181a1 1 0 011.827 1.035L17.475 8H20a1 1 0 011 1v2.5a1.5 1.5 0 01-3 0V10H2a1 1 0 010-1.5v-1a1 1 0 011-1h2.525l-1.005-4.141a1 1 0 011.827-1.035l1.699 3.181L10 4.323V3a1 1 0 011-1z" clipRule="evenodd" /></svg>,
  Brain: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
  Chart: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>,
  Filter: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
};

// --- UTILS ---
const cleanNumber = (val: any) => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  // Converte "100kg" o "100" in numero puro 100
  const num = parseFloat(String(val).replace(/[^\d.-]/g, ''));
  return isNaN(num) ? 0 : num;
};

const normalizeName = (name: string) => {
  if (!name) return "Sconosciuto";
  return name.toLowerCase()
    .replace(/\(.*\)/g, '')
    .trim()
    .replace(/^\w/, c => c.toUpperCase()); // Capitalize
};

const formatTime = (seconds: number) => {
  if (seconds < 60) return `${seconds.toFixed(2)}s`;
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(0);
  return `${m}:${s.padStart(2, '0')}`;
};

export default function StatsOverview() {
  const [data, setData] = useState<{ sessions: any[], sets: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filtri
  const [timeRange, setTimeRange] = useState<'month' | 'year' | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'running' | 'lifting'>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'pbs' | 'trends'>('overview');
  
  // Stati Coach
  const [coachAdvice, setCoachAdvice] = useState<string | null>(null);
  const [loadingCoach, setLoadingCoach] = useState(false);

  // 1. CARICAMENTO DATI
  useEffect(() => {
    async function loadFullHistory() {
      try {
        const { data: sessions } = await supabase.from('training_sessions').select('*').order('date', { ascending: true });
        const { data: groups } = await supabase.from('workout_groups').select('*');
        const { data: sets } = await supabase.from('workout_sets').select('*');

        if (sessions && groups && sets) {
          const groupToSessionMap = new Map();
          groups.forEach(g => groupToSessionMap.set(g.id, g.session_id));

          const sessionDateMap = new Map();
          const sessionTypeMap = new Map();
          sessions.forEach(s => {
            sessionDateMap.set(s.id, new Date(s.date));
            sessionTypeMap.set(s.id, s.type);
          });

          const enrichedSets = sets.map(set => {
            const sessionId = groupToSessionMap.get(set.group_id);
            return { 
              ...set, 
              date: sessionDateMap.get(sessionId),
              sessionType: sessionTypeMap.get(sessionId) || 'altro',
              sessionId 
            }; 
          }).filter(s => s.date);

          setData({ sessions, sets: enrichedSets });
        }
      } catch (e) {
        console.error("Errore fetch:", e);
      } finally {
        setLoading(false);
      }
    }
    loadFullHistory();
  }, []);

  // 2. MOTORE DI CALCOLO
  const stats = useMemo(() => {
    if (!data) return null;
    const now = new Date();
    const { sessions, sets } = data;

    // Filter Logic
    const isWithinTime = (date: Date) => {
      if (timeRange === 'all') return true;
      if (timeRange === 'year') return date.getFullYear() === now.getFullYear();
      if (timeRange === 'month') return (now.getTime() - date.getTime()) / (1000 * 3600 * 24) <= 30;
      return false;
    };

    const isWithinCategory = (type: string) => {
      type = (type || '').toLowerCase();
      if (categoryFilter === 'all') return true;
      if (categoryFilter === 'running') return ['pista', 'strada', 'gara'].includes(type);
      if (categoryFilter === 'lifting') return ['palestra', 'forza'].includes(type);
      return true;
    };

    const filteredSessions = sessions.filter(s => isWithinTime(new Date(s.date)) && isWithinCategory(s.type));
    const sessionIds = new Set(filteredSessions.map(s => s.id));
    const filteredSets = sets.filter(s => sessionIds.has(s.sessionId));

    // KPI Calculation
    let totalDist = 0;
    let totalVol = 0;
    let totalTime = 0;
    const typeCounts: Record<string, number> = {};
    const rpeTrend: { date: string, val: number }[] = [];
    const monthlyVol: Record<string, { dist: number, load: number }> = {};

    filteredSessions.forEach(s => {
      // Type Count
      const t = (s.type || 'altro').toLowerCase();
      typeCounts[t] = (typeCounts[t] || 0) + 1;
      
      // RPE Trend
      if (s.rpe) rpeTrend.push({ date: new Date(s.date).toLocaleDateString(), val: s.rpe });

      // Monthly Grouping (for Analysis)
      const mKey = new Date(s.date).toLocaleString('default', { month: 'short' });
      if (!monthlyVol[mKey]) monthlyVol[mKey] = { dist: 0, load: 0 };
    });

    filteredSets.forEach(s => {
      const w = cleanNumber(s.weight_kg);
      const r = cleanNumber(s.reps);
      const rep_sets = cleanNumber(s.sets);
      const d = cleanNumber(s.distance_m);
      const t = cleanNumber(s.time_s);

      const mKey = new Date(s.date).toLocaleString('default', { month: 'short' });
      if (!monthlyVol[mKey]) monthlyVol[mKey] = { dist: 0, load: 0 };

      // Volume Logic
      if (d > 0) {
        const dist = d * rep_sets;
        totalDist += dist;
        monthlyVol[mKey].dist += dist;
      }
      if (w > 0) {
        const load = w * r * rep_sets;
        totalVol += load;
        monthlyVol[mKey].load += load;
      }
      if (t > 0) {
         totalTime += t * rep_sets; // seconds
      }
    });

    // --- LOGICA RECORD (PBS) ---
    // Analizza tutto lo storico, non solo il filtrato, per trovare i veri record
    const allRelevantSets = categoryFilter === 'all' ? sets : sets.filter(s => isWithinCategory(s.sessionType));
    const pbs: Record<string, { value: number, unit: string, date: Date, type: 'time'|'weight'|'dist' }> = {};

    allRelevantSets.forEach(s => {
       const w = cleanNumber(s.weight_kg);
       const t = cleanNumber(s.time_s);
       const d = cleanNumber(s.distance_m);
       const name = normalizeName(s.exercise_name);

       if (name.length < 2) return;

       // Heuristic per determinare il tipo di record
       let isBetter = false;
       let currentType: 'time'|'weight'|'dist' = 'weight';
       let val = 0;
       let unit = '';

       if (t > 0 && d > 0 && w === 0) {
         // Corsa a tempo (es. 100m in 12s) -> MIN time is better
         currentType = 'time';
         val = t;
         unit = 's';
         if (!pbs[name] || val < pbs[name].value) isBetter = true;
       } 
       else if (w > 0) {
         // Sollevamento -> MAX weight is better
         currentType = 'weight';
         val = w;
         unit = 'kg';
         if (!pbs[name] || val > pbs[name].value) isBetter = true;
       }
       else if (d > 0 && t === 0) {
         // Salto/Lancio o Corsa distanza fissa -> MAX distance is better
         currentType = 'dist';
         val = d;
         unit = 'm';
         if (!pbs[name] || val > pbs[name].value) isBetter = true;
       }

       if (isBetter) {
         pbs[name] = { value: val, unit, date: s.date, type: currentType };
       }
    });

    return {
      count: filteredSessions.length,
      avgRpe: rpeTrend.length ? (rpeTrend.reduce((a,b)=>a+b.val, 0)/rpeTrend.length).toFixed(1) : "0",
      totalDistDisplay: totalDist > 1000 ? `${(totalDist/1000).toFixed(1)} km` : `${totalDist} m`,
      totalVolDisplay: totalVol > 0 ? `${(totalVol/1000).toFixed(1)}k kg` : null,
      totalTimeDisplay: totalTime > 0 ? `${(totalTime/3600).toFixed(1)} h` : null,
      typeCounts,
      rpeTrend,
      monthlyVol,
      pbs
    };

  }, [data, timeRange, categoryFilter]);

  const askCoach = async () => {
    if (!stats) return;
    setLoadingCoach(true);
    const advice = await getCoachAdvice({
      totalSessions: stats.count,
      avgRpe: stats.avgRpe,
      totalDistance: stats.totalDistDisplay
    });
    setCoachAdvice(advice);
    setLoadingCoach(false);
  };

  if (loading || !stats) return <div className="text-center py-20 text-slate-500 animate-pulse">Caricamento Analisi...</div>;

  return (
    <div className="space-y-6 pb-20 px-1">
      
      {/* 1. HEADER & FILTRI */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white tracking-tight">Analytics</h2>
          {/* Time Filter */}
          <div className="bg-slate-900 p-1 rounded-lg border border-slate-800 flex">
            {[{ id: 'month', l: '30G' }, { id: 'year', l: 'Anno' }, { id: 'all', l: 'Tutti' }].map((r: any) => (
             <button key={r.id} onClick={() => setTimeRange(r.id)} 
               className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${timeRange === r.id ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
               {r.l}
             </button>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2">
            {[ { id: 'all', label: 'Tutto' }, { id: 'running', label: 'Corsa & Pista' }, { id: 'lifting', label: 'Sala Pesi' }].map(c => (
              <button key={c.id} onClick={() => setCategoryFilter(c.id as any)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-all
                  ${categoryFilter === c.id ? 'bg-slate-800 border-indigo-500 text-indigo-400' : 'bg-transparent border-slate-800 text-slate-500'}`}
              >
                {c.id === 'running' && <Icons.Run />}
                {c.id === 'lifting' && <Icons.Dumbbell />}
                {c.label}
              </button>
            ))}
        </div>
      </div>

      {/* 2. KPI GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <KpiCard label="Sessioni" value={stats.count} icon="📅" color="slate" />
        <KpiCard label="Intensità Media" value={stats.avgRpe} sub="/10" icon={<Icons.Fire />} color="orange" />
        {/* Dynamic Card based on Data */}
        {stats.totalVolDisplay ? (
           <KpiCard label="Volume Carico" value={stats.totalVolDisplay} sub="Sollevati" icon={<Icons.Dumbbell />} color="indigo" />
        ) : (
           <KpiCard label="Tempo Attivo" value={stats.totalTimeDisplay || '0 h'} sub="Durata tot" icon={<Icons.Clock />} color="indigo" />
        )}
        <KpiCard label="Distanza" value={stats.totalDistDisplay} sub="Totale" icon={<Icons.Run />} color="blue" />
      </div>

      {/* 3. TABS NAVIGATION */}
      <div className="border-b border-slate-800 flex gap-6 px-1">
        {[ { id: 'overview', l: 'Dashboard' }, { id: 'trends', l: 'Analisi Deep' }, { id: 'pbs', l: 'Records Utente' } ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 text-sm font-bold transition-all relative ${activeTab === tab.id ? 'text-blue-400' : 'text-slate-500'}`}
          >
            {tab.l}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_8px_#3b82f6]"></div>}
          </button>
        ))}
      </div>

      {/* 4. CONTENT AREA */}
      <div className="min-h-[400px]">
        
        {/* === DASHBOARD === */}
        {activeTab === 'overview' && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
             {/* AI Insight */}
             <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 border border-indigo-500/20 p-5 rounded-2xl relative overflow-hidden">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2 text-indigo-400 mb-2">
                    <Icons.Brain />
                    <span className="text-xs font-bold uppercase tracking-widest">Coach AI</span>
                  </div>
                  <button onClick={askCoach} disabled={loadingCoach} className="text-xs bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white px-3 py-1 rounded-md transition border border-indigo-500/30">
                    {loadingCoach ? 'Analisi...' : 'Genera Report'}
                  </button>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed italic">
                  {coachAdvice || `Clicca su "Genera Report" per ottenere un'analisi tecnica dai tuoi ${stats.count} allenamenti recenti.`}
                </p>
             </div>

             {/* Distribution Chart */}
             <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
               <h3 className="text-slate-400 text-xs font-bold uppercase mb-4 flex items-center gap-2"><Icons.Chart /> Distribuzione Allenamenti</h3>
               <div className="space-y-3">
                 {Object.entries(stats.typeCounts).map(([type, count]: any) => (
                   <div key={type} className="flex items-center gap-3">
                     <span className="w-20 text-xs text-slate-400 capitalize truncate">{type}</span>
                     <div className="flex-1 h-2 bg-slate-950 rounded-full overflow-hidden">
                       <div className={`h-full rounded-full ${type.includes('pista') ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${(count / stats.count) * 100}%` }}></div>
                     </div>
                     <span className="text-xs font-mono w-4 text-right text-slate-300">{count}</span>
                   </div>
                 ))}
               </div>
             </div>
          </div>
        )}

        {/* === TRENDS (NEW) === */}
        {activeTab === 'trends' && (
          <div className="space-y-4 animate-in fade-in zoom-in-95">
            {/* Volume/Dist Chart */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
              <h3 className="text-slate-200 font-bold mb-6 text-sm">Volume Mensile (km & kg)</h3>
              <div className="h-40 flex items-end justify-between gap-2 px-2">
                 {Object.entries(stats.monthlyVol).slice(-6).map(([month, vol]: any) => (
                   <div key={month} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="w-full flex gap-1 items-end justify-center h-full">
                        {/* Bar Distance */}
                        {vol.dist > 0 && (
                          <div style={{ height: `${Math.min(100, (vol.dist / 50000) * 100)}%` }} 
                               className="w-3 bg-blue-500/80 rounded-t-sm hover:bg-blue-400 transition-all relative group-hover:scale-y-110">
                          </div>
                        )}
                        {/* Bar Load */}
                        {vol.load > 0 && (
                          <div style={{ height: `${Math.min(100, (vol.load / 10000) * 100)}%` }} 
                               className="w-3 bg-indigo-500/80 rounded-t-sm hover:bg-indigo-400 transition-all relative group-hover:scale-y-110">
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] uppercase font-bold text-slate-500">{month}</span>
                   </div>
                 ))}
              </div>
            </div>

             {/* RPE Trend Chart */}
             <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
               <h3 className="text-slate-200 font-bold mb-4 text-sm">Trend Fatica (RPE)</h3>
               <div className="h-32 flex items-end gap-1">
                 {stats.rpeTrend.slice(-20).map((pt, i) => (
                   <div key={i} className="flex-1 bg-slate-800 hover:bg-orange-500 transition-colors rounded-sm relative group" 
                        style={{ height: `${pt.val * 10}%` }}>
                     <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-1 rounded">
                       {pt.val}
                     </div>
                   </div>
                 ))}
               </div>
             </div>
          </div>
        )}

        {/* === RECORDS (REWORKED) === */}
        {activeTab === 'pbs' && (
          <div className="grid grid-cols-1 gap-3 animate-in fade-in slide-in-from-right-4">
            {Object.entries(stats.pbs).length > 0 ? (
               Object.entries(stats.pbs)
                 .sort(([,a], [,b]) => {
                   // Sort logic: category priority? or just name? 
                   // Let's sort by date (newest first)
                   return new Date(b.date).getTime() - new Date(a.date).getTime();
                 })
                 .map(([name, rec]: any, idx) => (
                 <div key={idx} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex justify-between items-center group hover:border-blue-500/50 transition-colors">
                   <div className="flex flex-col">
                     <span className="text-white font-bold text-lg capitalize">{name}</span>
                     <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">
                       {new Date(rec.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: '2-digit' })}
                     </span>
                   </div>
                   <div className="text-right">
                     <div className="text-2xl font-black text-blue-400 font-mono tracking-tighter">
                       {rec.type === 'time' ? formatTime(rec.value) : rec.value}
                       <span className="text-sm text-slate-600 ml-1 font-sans font-normal">{rec.unit}</span>
                     </div>
                     <div className="text-[10px] text-slate-600 font-bold uppercase">Personal Best</div>
                   </div>
                 </div>
               ))
            ) : (
              <div className="text-center py-20 text-slate-500">
                <Icons.Trophy />
                <p className="mt-2 text-sm">Ancora nessun record registrato.</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

// UI COMPONENTS
function KpiCard({ label, value, sub, icon, color }: any) {
  const styles: any = {
    slate: "bg-slate-800/40 border-slate-700/50 text-slate-300",
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    orange: "bg-orange-500/10 border-orange-500/20 text-orange-400",
    indigo: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
  };
  return (
    <div className={`p-4 rounded-2xl border ${styles[color]} relative overflow-hidden flex flex-col justify-between min-h-[110px]`}>
       <div className="flex justify-between items-start z-10">
         <span className="text-[9px] uppercase font-bold tracking-widest opacity-70">{label}</span>
         <div className="opacity-80 scale-75">{icon}</div>
       </div>
       <div className="z-10 mt-2">
         <div className="text-2xl font-black tracking-tighter text-white">{value}</div>
         <div className="text-[10px] opacity-60 font-medium">{sub}</div>
       </div>
    </div>
  );
}
