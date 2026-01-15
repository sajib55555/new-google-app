
import React, { useState } from 'react';
import { generateWorkout } from '../services/geminiService';
import { UserProfile, WorkoutPlan } from '../types';

const WorkoutPlanner: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      // Logic: If calories are low, lighter workout. If surplus, harder.
      const currentCalories = 1640; // Mock current intake
      const diff = user.goals.calories - currentCalories;
      const result = await generateWorkout(user, diff);
      setPlan(result);
    } catch (err) {
      console.error(err);
      alert('Fitness engine offline.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-black mb-2 tracking-tighter italic uppercase">Body Architect</h2>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            Personalized workouts calibrated to your daily calorie log and biometric profile.
          </p>
          
          <button 
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full bg-emerald-500 py-4 rounded-2xl font-black text-lg shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Protocol
              </>
            )}
          </button>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
      </div>

      {plan && (
        <div className="space-y-6">
          <div className="flex justify-between items-end px-2">
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Active Plan</span>
              <h3 className="text-xl font-bold text-slate-800">{plan.title}</h3>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-slate-500">{plan.total_duration}</span>
            </div>
          </div>

          <div className="space-y-4">
            {plan.exercises.map((ex, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm group hover:border-emerald-200 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-black text-slate-800 text-lg group-hover:text-emerald-600 transition-colors">{ex.name}</h4>
                  <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">{ex.duration}</span>
                </div>
                <p className="text-sm text-slate-500 mb-4">{ex.instructions}</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-400">Burns approx {ex.target_calories} kcal</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutPlanner;
