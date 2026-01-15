
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { supabase } from '../services/supabaseClient';

interface SettingsProps {
  user: UserProfile;
  onUpdate: (updated: UserProfile) => void;
  onReset: () => void;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onUpdate, onReset, onClose }) => {
  const [editUser, setEditUser] = useState<UserProfile>({ ...user });

  const handleSave = () => {
    onUpdate(editUser);
    onClose();
  };

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      onReset();
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-slate-50 flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden">
      
      {/* Premium Header */}
      <header className="bg-white px-8 py-10 border-b border-slate-100 flex justify-between items-end">
        <div>
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-1 block">Configuration</span>
          <h2 className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter leading-none">System Settings</h2>
        </div>
        <button 
            onClick={onClose} 
            className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl active:scale-95 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-10 pb-40 no-scrollbar">
        
        {/* User Identity Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black italic">ID</div>
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Profile Identity</h3>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Full Identity</label>
              <input 
                type="text" 
                value={editUser.name} 
                onChange={e => setEditUser({...editUser, name: e.target.value})}
                className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white rounded-2xl px-6 py-4 font-black italic text-slate-800 transition-all outline-none"
                placeholder="Architect Name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Mass (kg)</label>
                  <input 
                    type="number" 
                    value={editUser.stats.weight} 
                    onChange={e => setEditUser({...editUser, stats: {...editUser.stats, weight: parseInt(e.target.value)}})} 
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-500/20 rounded-2xl px-6 py-4 font-black italic text-slate-800 transition-all outline-none" 
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Altitude (cm)</label>
                  <input 
                    type="number" 
                    value={editUser.stats.height} 
                    onChange={e => setEditUser({...editUser, stats: {...editUser.stats, height: parseInt(e.target.value)}})} 
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-500/20 rounded-2xl px-6 py-4 font-black italic text-slate-800 transition-all outline-none" 
                  />
               </div>
            </div>
          </div>
        </section>

        {/* Protocol Calibration */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black italic">CP</div>
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Core Protocol</h3>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6">
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Dietary Logic</label>
                <div className="relative">
                    <select 
                        value={editUser.dietary_preference} 
                        onChange={e => setEditUser({...editUser, dietary_preference: e.target.value})}
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500/20 rounded-2xl px-6 py-4 font-black italic text-slate-800 transition-all outline-none appearance-none"
                    >
                    {['No Preference', 'Vegan', 'Keto', 'Paleo', 'Low Carb'].map(d => <option key={d}>{d}</option>)}
                    </select>
                    <div className="absolute right-6 top-5 pointer-events-none text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Energy Target (kcal)</label>
                <input 
                  type="number" 
                  value={editUser.goals.calories} 
                  onChange={e => setEditUser({...editUser, goals: {...editUser.goals, calories: parseInt(e.target.value)}})} 
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-500/20 rounded-2xl px-6 py-4 font-black italic text-emerald-600 transition-all outline-none" 
                />
             </div>
          </div>
        </section>

        {/* Membership Status */}
        <section className="space-y-6">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-amber-500 rounded-xl flex items-center justify-center text-white font-black italic">PRO</div>
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">License Status</h3>
          </div>
           <div className={`p-1 rounded-[3rem] transition-all duration-500 ${editUser.is_pro ? 'bg-gradient-to-br from-amber-400 via-emerald-500 to-indigo-600' : 'bg-slate-200'}`}>
              <div className="bg-white p-8 rounded-[2.8rem] flex justify-between items-center overflow-hidden relative">
                 <div className="z-10">
                    <h4 className="font-black text-slate-800 italic text-xl leading-none mb-1">Architect Pro</h4>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                       Status: <span className={editUser.is_pro ? 'text-emerald-600' : 'text-slate-400'}>{editUser.is_pro ? 'Authenticated' : 'Standard Tier'}</span>
                    </p>
                 </div>
                 <button 
                    onClick={() => setEditUser({...editUser, is_pro: !editUser.is_pro})}
                    className={`z-10 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95 ${editUser.is_pro ? 'bg-slate-900 text-white' : 'bg-emerald-600 text-white'}`}
                 >
                    {editUser.is_pro ? 'Deactivate' : 'Go Elite'}
                 </button>
              </div>
           </div>
        </section>

        {/* Sign Out Section */}
        <section className="pt-10 space-y-4">
           <button 
             onClick={handleSignOut}
             className="w-full bg-slate-900 text-white py-6 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all"
           >
              Synchronize Logout
           </button>
           <button 
             onClick={() => { if(confirm('Wipe ALL cloud data?')) alert('Contact support for account deletion.'); }}
             className="w-full bg-rose-50 text-rose-600 py-4 rounded-[2rem] text-[8px] font-black uppercase tracking-[0.2em] border border-rose-100"
           >
              Terminate Cloud Node
           </button>
        </section>
      </div>

      {/* Floating Save Action */}
      <footer className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-white via-white/90 to-transparent">
         <button 
           onClick={handleSave}
           className="w-full bg-emerald-600 text-white py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] shadow-[0_25px_50px_-12px_rgba(16,185,129,0.5)] active:scale-95 transition-all flex items-center justify-center gap-3"
         >
            Update Global Profile
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
         </button>
      </footer>
    </div>
  );
};

export default Settings;
