
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { UserProfile, NutritionData } from '../types';

interface DashboardProps {
  user: UserProfile;
  waterIntake: number;
  currentCals: number;
  onAddWater: (amt: number) => void;
  onFindHealthy: () => void;
  onOpenCoach: () => void;
  history: NutritionData[];
}

const Dashboard: React.FC<DashboardProps> = ({ user, waterIntake, currentCals, onAddWater, onFindHealthy, onOpenCoach, history }) => {
  const macroStats = useMemo(() => {
    const today = new Date().toDateString();
    const todayLogs = history.filter(h => h.timestamp && new Date(h.timestamp).toDateString() === today);
    
    return {
      p: todayLogs.reduce((s, h) => s + h.protein, 0),
      c: todayLogs.reduce((s, h) => s + h.carbs, 0),
      f: todayLogs.reduce((s, h) => s + h.fat, 0),
    };
  }, [history]);

  const macroData = [
    { name: 'Protein', value: macroStats.p, color: '#10b981' },
    { name: 'Carbs', value: macroStats.c, color: '#3b82f6' },
    { name: 'Fat', value: macroStats.f, color: '#f59e0b' },
  ];

  const dailyHistoryData = useMemo(() => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toDateString();
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      const dayCals = history
        .filter(h => h.timestamp && new Date(h.timestamp).toDateString() === dayStr)
        .reduce((sum, h) => sum + h.calories, 0);
        
      last7Days.push({ name: label, calories: dayCals || 0, isToday: i === 0 });
    }
    return last7Days;
  }, [history]);

  const progress = (currentCals / user.goals.calories) * 100;
  const waterProgress = (waterIntake / user.goals.water_ml) * 100;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-700 pb-16">
      
      {/* Hero Greeting Card */}
      <div className="relative group overflow-hidden bg-slate-900 rounded-[3rem] p-8 text-white shadow-2xl border border-white/5">
        <div className="relative z-10">
          <span className="text-[10px] font-black uppercase text-emerald-400 tracking-[0.3em] mb-2 block">Biological Status</span>
          <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none mb-4">
            Welcome, <br/>{user.name.split(' ')[0] || 'Architect'}.
          </h2>
          <div className="flex items-center gap-3">
             <div className="px-4 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">{user.goals.primary_objective}</span>
             </div>
             {!user.is_pro && (
               <div className="px-4 py-1.5 bg-amber-500/20 rounded-full border border-amber-500/30 flex items-center gap-2">
                 <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">{user.daily_scan_count}/3 Scans</span>
               </div>
             )}
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-[80px] -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-600/10 rounded-full blur-[60px] -ml-24 -mb-24" />
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Energy Intake */}
        <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 relative group overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black text-slate-800 italic uppercase tracking-tighter">Energy Log</h3>
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">Live</span>
          </div>
          <div className="flex items-end justify-between gap-4 mb-6">
             <div>
                <span className="text-4xl font-black italic text-slate-900 leading-none">{currentCals}</span>
                <span className="text-slate-400 text-xs font-bold uppercase ml-2">/ {user.goals.calories} kcal</span>
             </div>
             <div className="text-right">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Metabolic Burn</span>
                <span className="text-sm font-bold text-slate-600 italic">Remaining: {Math.max(0, user.goals.calories - currentCals)}</span>
             </div>
          </div>
          <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden shadow-inner border border-slate-100">
             <div className="bg-emerald-500 h-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(16,185,129,0.3)]" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
        </div>

        {/* Macro Balance Ring */}
        <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl border border-white/5 relative overflow-hidden">
          <h3 className="text-lg font-black text-white italic uppercase tracking-tighter mb-6">Macro Synthesis</h3>
          <div className="flex items-center gap-6">
            <div className="h-32 w-32 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={macroData} innerRadius={40} outerRadius={55} paddingAngle={8} dataKey="value" stroke="none">
                    {macroData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="text-center">
                    <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">Goal</span>
                    <span className="text-sm font-black text-white italic">{user.goals.protein + user.goals.carbs + user.goals.fat}g</span>
                 </div>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              {macroData.map(m => (
                <div key={m.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.color }} />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{m.name}</span>
                  </div>
                  <span className="text-xs font-black text-white italic">{m.value}g</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hydration Smart Widget */}
      <div className="bg-indigo-600 p-8 rounded-[3rem] shadow-2xl shadow-indigo-200 relative overflow-hidden group">
         <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
               <div>
                  <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none mb-1">Cellular Hydration</h3>
                  <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest opacity-80">Daily Target Refill</p>
               </div>
               <div className="text-right">
                  <span className="text-3xl font-black text-white italic leading-none">{waterIntake}</span>
                  <span className="text-indigo-200 text-xs font-bold uppercase ml-1">ml</span>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
               <button onClick={() => onAddWater(250)} className="bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/10 transition-all active:scale-95">+ 250ml</button>
               <button onClick={() => onAddWater(500)} className="bg-white text-indigo-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-900/20 transition-all active:scale-95">+ 500ml</button>
            </div>
            <div className="w-full h-1.5 bg-indigo-900/30 rounded-full overflow-hidden">
               <div className="bg-white h-full transition-all duration-700 ease-out" style={{ width: `${Math.min(waterProgress, 100)}%` }} />
            </div>
         </div>
         <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
      </div>

      {/* Action: NutriVision Coach (Premium Styled) */}
      <button 
        onClick={onOpenCoach} 
        className="w-full bg-indigo-50 p-2 rounded-[3.5rem] shadow-2xl border border-indigo-100 group transition-all active:scale-[0.98]"
      >
        <div className="bg-indigo-950 rounded-[3rem] p-6 flex items-center justify-between overflow-hidden relative">
          <div className="flex items-center gap-4 z-10">
            <div className="w-14 h-14 bg-indigo-500 rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-indigo-500/20 group-hover:rotate-6 transition-transform">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
               </svg>
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                 <h3 className="text-lg font-black text-white italic uppercase tracking-tighter leading-none mb-1">Live Vision Coach</h3>
                 {!user.is_pro && (
                   <div className="bg-amber-500 rounded p-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-2 w-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                   </div>
                 )}
              </div>
              <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest">Real-time Nutritional Insight</p>
            </div>
          </div>
          <div className="z-10 bg-white/5 p-3 rounded-full border border-white/10 text-indigo-400 group-hover:translate-x-2 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </div>
        </div>
      </button>

      {/* Action: Nearby Fuel (Premium Styled) */}
      <button 
        onClick={onFindHealthy} 
        className="w-full bg-white p-2 rounded-[3.5rem] shadow-2xl border border-slate-100 group transition-all active:scale-[0.98]"
      >
        <div className="bg-slate-900 rounded-[3rem] p-6 flex items-center justify-between overflow-hidden relative">
          <div className="flex items-center gap-4 z-10">
            <div className="w-14 h-14 bg-emerald-500 rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-emerald-500/20 group-hover:rotate-6 transition-transform">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
               </svg>
            </div>
            <div className="text-left">
              <h3 className="text-lg font-black text-white italic uppercase tracking-tighter leading-none mb-1">Nearby Fueling</h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">AI Location Intelligence</p>
            </div>
          </div>
          <div className="z-10 bg-white/5 p-3 rounded-full border border-white/10 text-emerald-400 group-hover:translate-x-2 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </div>
        </div>
      </button>

    </div>
  );
};

export default Dashboard;
