
import React, { useState } from 'react';
import { UserProfile } from '../types';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    name: '',
    age: 25,
    weight: 70,
    height: 175,
    objective: 'Weight Loss',
    diet: 'No Preference',
    activity: 'Moderately Active'
  });

  const next = () => setStep(s => s + 1);
  const prev = () => setStep(s => s - 1);

  const finish = () => {
    const baseCals = data.objective === 'Weight Loss' ? 1800 : data.objective === 'Muscle Gain' ? 2600 : 2200;
    
    const profile: UserProfile = {
      id: '', // Will be filled by App.tsx session
      name: data.name,
      onboarded: true,
      scan_count: 0,
      daily_scan_count: 0,
      last_scan_date: '',
      is_pro: false, // Default to free user
      dietary_preference: data.diet,
      activity_level: data.activity,
      goals: {
        calories: baseCals,
        protein: 150,
        carbs: 200,
        fat: 70,
        water_ml: 2500,
        primary_objective: data.objective
      },
      stats: {
        weight: data.weight,
        height: data.height,
        age: data.age
      }
    };
    onComplete(profile);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col p-8 overflow-y-auto animate-in fade-in duration-700">
      <div className="w-full flex justify-between items-center mb-12">
        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden mr-6 shadow-inner">
           <div 
             className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 transition-all duration-700 shadow-[0_0_15px_rgba(16,185,129,0.5)]" 
             style={{ width: `${(step / 6) * 100}%` }} 
           />
        </div>
        <span className="text-[10px] font-black text-slate-500 tracking-[0.2em]">0{step} / 06</span>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        {step === 1 && (
          <div className="space-y-10 animate-in slide-in-from-right duration-500">
            <div>
               <span className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.4em] mb-3 block">Initialization</span>
               <h2 className="text-5xl font-black text-white italic uppercase leading-none tracking-tighter">Welcome to <br/>NutriSnap.</h2>
            </div>
            <p className="text-slate-400 font-medium text-sm leading-relaxed">System requires identity calibration. What should your AI Coach call you?</p>
            <div className="relative">
              <input 
                autoFocus
                type="text" 
                value={data.name}
                onChange={e => setData({...data, name: e.target.value})}
                placeholder="USER IDENTITY"
                className="w-full text-2xl font-black bg-white/5 border-2 border-white/5 rounded-[2rem] p-8 text-white focus:border-emerald-500/30 focus:bg-white/10 transition-all outline-none placeholder:text-slate-700"
              />
            </div>
            <button disabled={!data.name} onClick={next} className="w-full bg-emerald-600 text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-sm shadow-[0_25px_50px_-12px_rgba(16,185,129,0.3)] disabled:opacity-30 transition-all active:scale-95">Begin Sync</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-10 animate-in slide-in-from-right duration-500">
            <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Biometrics.</h2>
            <div className="space-y-10 bg-white/5 p-8 rounded-[3rem] border border-white/5 shadow-2xl">
              <StatSliderDark label="Biological Age" val={data.age} min={13} max={100} onChange={v => setData({...data, age: v})} />
              <StatSliderDark label="Body Mass (kg)" val={data.weight} min={40} max={200} onChange={v => setData({...data, weight: v})} />
              <StatSliderDark label="Altitude (cm)" val={data.height} min={100} max={220} onChange={v => setData({...data, height: v})} />
            </div>
            <div className="flex gap-4">
              <button onClick={prev} className="flex-1 bg-white/5 border border-white/10 py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-widest text-slate-400">Back</button>
              <button onClick={next} className="flex-[2] bg-indigo-600 text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-sm shadow-[0_25px_50px_-12px_rgba(79,70,229,0.3)]">Continue Sync</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-10 animate-in slide-in-from-right duration-500">
            <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">Global Target.</h2>
            <div className="grid gap-4">
              {['Weight Loss', 'Muscle Gain', 'Health Maintenance', 'Peak Performance'].map(g => (
                <button 
                  key={g} 
                  onClick={() => { setData({...data, objective: g}); next(); }}
                  className={`p-8 rounded-[2.5rem] text-left border-2 transition-all flex items-center justify-between group ${data.objective === g ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/5 bg-white/5'}`}
                >
                  <p className={`text-lg font-black italic uppercase tracking-tight ${data.objective === g ? 'text-white' : 'text-slate-400'}`}>{g}</p>
                </button>
              ))}
            </div>
            <button onClick={prev} className="w-full text-slate-600 font-black text-[10px] uppercase tracking-widest py-2">Back</button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-10 animate-in slide-in-from-right duration-500">
            <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Fuel Logic.</h2>
            <div className="grid grid-cols-1 gap-3">
              {['No Preference', 'Vegan', 'Keto', 'Paleo', 'Intermittent Fasting'].map(d => (
                <button 
                  key={d} 
                  onClick={() => { setData({...data, diet: d}); next(); }}
                  className={`p-6 rounded-[2rem] text-left border-2 transition-all flex items-center justify-between ${data.diet === d ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/5 bg-white/5'}`}
                >
                  <p className={`text-base font-black italic uppercase tracking-tight ${data.diet === d ? 'text-white' : 'text-slate-400'}`}>{d}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-10 animate-in slide-in-from-right duration-500">
            <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">Movement Level.</h2>
            <div className="grid gap-3">
              {['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active', 'Pro Athlete'].map(label => (
                <button 
                  key={label} 
                  onClick={() => { setData({...data, activity: label}); next(); }}
                  className={`p-6 rounded-[2.5rem] text-left border-2 transition-all flex items-center justify-between group ${data.activity === label ? 'border-white bg-white/10' : 'border-white/5 bg-white/5'}`}
                >
                  <p className={`text-base font-black italic uppercase tracking-tight ${data.activity === label ? 'text-white' : 'text-slate-400'}`}>{label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="text-center space-y-12 animate-in zoom-in duration-700">
            <div className="w-32 h-32 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.2)] border border-emerald-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <div>
              <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none mb-4">Profile Ready.</h2>
              <p className="text-slate-500 text-sm leading-relaxed px-6 font-medium">Metabolic markers established. Welcome, <span className="text-white">{data.name.toUpperCase()}</span>.</p>
            </div>
            <button onClick={finish} className="w-full bg-white text-slate-950 py-8 rounded-[3rem] font-black uppercase tracking-[0.3em] text-sm shadow-[0_25px_50px_-12px_rgba(255,255,255,0.2)] transition-all active:scale-95">Initialize Journey</button>
          </div>
        )}
      </div>
    </div>
  );
};

const StatSliderDark: React.FC<{ label: string; val: number; min: number; max: number; onChange: (v: number) => void }> = ({ label, val, min, max, onChange }) => (
  <div className="space-y-4">
    <div className="flex justify-between items-end">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 leading-none">{label}</span>
      <span className="text-3xl font-black text-white italic leading-none">{val}</span>
    </div>
    <input type="range" min={min} max={max} value={val} onChange={e => onChange(parseInt(e.target.value))} className="w-full accent-emerald-500 h-2 bg-white/5 rounded-full appearance-none cursor-pointer" />
  </div>
);

export default Onboarding;
