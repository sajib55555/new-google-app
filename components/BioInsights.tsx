
import React, { useState } from 'react';
import { getRecoveryProtocol, generateGoalVision, analyzeProgress } from '../services/geminiService';
import { UserProfile, SleepData, RecoveryProtocol, ProgressReview } from '../types';

interface BioInsightsProps {
  user: UserProfile;
  triggerPaywall: () => void;
}

const BioInsights: React.FC<BioInsightsProps> = ({ user, triggerPaywall }) => {
  const [sleep, setSleep] = useState<SleepData>({ hours: 7, quality: 7, stress_level: 5 });
  const [protocol, setProtocol] = useState<RecoveryProtocol | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Peak Visualization State
  const [goalImage, setGoalImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Progress Review State
  const [beforeImg, setBeforeImg] = useState<string | null>(null);
  const [afterImg, setAfterImg] = useState<string | null>(null);
  const [review, setReview] = useState<ProgressReview | null>(null);
  const [isProgressLoading, setIsProgressLoading] = useState(false);

  const handleAnalyzeRecovery = async () => {
    setIsLoading(true);
    try {
      const res = await getRecoveryProtocol(sleep, user);
      setProtocol(res);
    } catch (err) {
      console.error(err);
      alert('Analysis failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVisualizeGoal = async () => {
    if (!user.is_pro) {
      triggerPaywall();
      return;
    }
    if (!(window as any).aistudio?.hasSelectedApiKey()) {
      await (window as any).aistudio?.openSelectKey();
    }
    setIsGenerating(true);
    try {
      const img = await generateGoalVision(`A person matching these stats: ${user.stats.weight}kg, ${user.stats.age} years old, achieving their fitness peak at 10% body fat, standing on a sunrise mountain peak, cinematic and hyper-realistic.`);
      setGoalImage(img);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleProgressFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    if (!user.is_pro) {
      triggerPaywall();
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        if (type === 'before') setBeforeImg(base64);
        else setAfterImg(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeProgress = async () => {
    if (!user.is_pro) {
      triggerPaywall();
      return;
    }
    if (!beforeImg || !afterImg) return;
    setIsProgressLoading(true);
    try {
      const result = await analyzeProgress(beforeImg, afterImg);
      setReview(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProgressLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      
      {/* 1. Goal Vision Section - Updated with Lock for free users */}
      <div className="bg-indigo-950 rounded-[2.5rem] overflow-hidden shadow-2xl relative border border-white/5">
        {goalImage ? (
          <div className="relative aspect-[16/9] w-full group">
            <img src={goalImage} className="w-full h-full object-cover" alt="Goal Vision" />
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/90 via-transparent to-transparent flex items-end p-6">
              <div className="w-full flex justify-between items-end">
                <div>
                  <h4 className="text-white font-black text-xl italic uppercase tracking-tighter">Your North Star</h4>
                  <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">AI Generated Visualization</p>
                </div>
                <button onClick={() => setGoalImage(null)} className="text-white/40 hover:text-white transition-colors bg-white/10 p-2 rounded-full backdrop-blur-md">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-10 text-center relative">
            {!user.is_pro && (
              <div className="absolute top-6 right-6 bg-amber-500 rounded-full p-1.5 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
            )}
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30 shadow-2xl shadow-emerald-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter italic leading-none">Peak Visualization</h3>
            <p className="text-indigo-300 text-[11px] mb-8 px-8 font-medium">{user.is_pro ? 'AI Manifestation of your transformation goal.' : 'Elite AI Visualizer • Pro Access Only'}</p>
            <button 
              onClick={handleVisualizeGoal}
              disabled={isGenerating}
              className={`px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-50 ${user.is_pro ? 'bg-emerald-600 text-white shadow-emerald-950 hover:bg-emerald-500' : 'bg-slate-800 text-slate-400'}`}
            >
              {isGenerating ? 'Calibrating Lens...' : 'Manifest Vision'}
            </button>
          </div>
        )}
      </div>

      {/* 2. Circadian Engine Section */}
      <div className="bg-indigo-950 p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/30">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
               </svg>
            </div>
            <div>
              <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none">Circadian Engine</h2>
              <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest mt-1">Bio-Metric Optimization</p>
            </div>
          </div>
          
          <div className="space-y-8 mb-10">
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-indigo-400">
                <span>Sleep Duration</span>
                <span className="text-emerald-400">{sleep.hours} Hours</span>
              </div>
              <input 
                type="range" min="3" max="12" step="0.5" 
                value={sleep.hours} 
                onChange={e => setSleep({...sleep, hours: parseFloat(e.target.value)})}
                className="w-full accent-emerald-500 bg-white/10 h-1.5 rounded-full appearance-none cursor-pointer"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Quality (1-10)</span>
                <input 
                  type="number" min="1" max="10" 
                  value={sleep.quality} 
                  onChange={e => setSleep({...sleep, quality: parseInt(e.target.value)})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500 text-white"
                />
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Stress (1-10)</span>
                <input 
                  type="number" min="1" max="10" 
                  value={sleep.stress_level} 
                  onChange={e => setSleep({...sleep, stress_level: parseInt(e.target.value)})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500 text-white"
                />
              </div>
            </div>
          </div>

          <button 
            onClick={handleAnalyzeRecovery}
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-950 active:scale-95 transition-all hover:bg-indigo-500"
          >
            {isLoading ? 'Calibrating...' : 'Calibrate Recovery'}
          </button>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
      </div>

      {protocol && (
        <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
          <div className="bg-indigo-950 p-10 rounded-[2.5rem] border border-white/5 shadow-2xl">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-xl font-black text-white italic uppercase leading-none">System Readiness</h3>
              <div className={`text-4xl font-black italic ${protocol.readiness_score > 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {protocol.readiness_score}%
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                <h4 className="text-[10px] font-black uppercase text-indigo-400 mb-2 tracking-widest">Protocol Recommendation</h4>
                <p className="text-[13px] text-slate-300 leading-relaxed font-medium">{protocol.activity_recommendation}</p>
              </div>

              <div className="bg-emerald-400/10 p-6 rounded-3xl border border-emerald-400/20">
                <h4 className="text-[10px] font-black uppercase text-emerald-400 mb-2 tracking-widest">Nutritional Focus</h4>
                <p className="text-[13px] text-emerald-100 leading-relaxed italic font-medium">"{protocol.nutrition_focus}"</p>
              </div>

              <div className="space-y-4 pt-4">
                <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Bio-Optimization Tips</h4>
                {protocol.supplement_tips.map((tip, i) => (
                  <div key={i} className="flex gap-4 text-[12px] text-slate-400 bg-white/5 p-4 rounded-2xl border border-white/5">
                    <span className="text-indigo-400 font-black">#</span>
                    <span className="font-medium">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Transformation AI Section */}
      <div className="bg-indigo-950 p-10 rounded-[2.5rem] shadow-2xl border border-white/5 relative">
        <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30 relative">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
               </svg>
               {!user.is_pro && (
                  <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-2 w-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
               )}
            </div>
            <div>
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">Transformation AI</h2>
                <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest mt-1">{user.is_pro ? 'Longitudinal Evolution Audit' : 'Elite Feature • Pro Required'}</p>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-5 mb-10">
          <label className="block aspect-square bg-white/5 rounded-3xl border-2 border-dashed border-white/10 cursor-pointer overflow-hidden relative group">
            {beforeImg ? <img src={`data:image/jpeg;base64,${beforeImg}`} className="w-full h-full object-cover" /> : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    <div className="text-indigo-500/50 text-[8px] font-black uppercase tracking-widest">Before</div>
                </div>
            )}
            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleProgressFileChange(e, 'before')} />
          </label>
          <label className="block aspect-square bg-white/5 rounded-3xl border-2 border-dashed border-white/10 cursor-pointer overflow-hidden relative group">
            {afterImg ? <img src={`data:image/jpeg;base64,${afterImg}`} className="w-full h-full object-cover" /> : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    <div className="text-indigo-500/50 text-[8px] font-black uppercase tracking-widest">After</div>
                </div>
            )}
            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleProgressFileChange(e, 'after')} />
          </label>
        </div>

        <button 
          onClick={handleAnalyzeProgress}
          disabled={isProgressLoading || !beforeImg || !afterImg}
          className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl transition-all active:scale-95 disabled:opacity-50 ${user.is_pro ? 'bg-indigo-600 text-white shadow-indigo-950 hover:bg-indigo-500' : 'bg-slate-800 text-slate-400'}`}
        >
          {isProgressLoading ? 'Auditing Matrix...' : 'Compare Evolution'}
        </button>

        {review && (
          <div className="mt-10 bg-emerald-950 text-white p-8 rounded-[2.5rem] shadow-2xl animate-in fade-in zoom-in duration-500 border border-white/5">
            <p className="text-sm font-medium italic mb-6 leading-relaxed text-emerald-100">"{review.summary}"</p>
            <div className="space-y-3 mb-8">
                <h4 className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-4">Metabolic Markers</h4>
                {review.changes.map((c, i) => (
                    <div key={i} className="text-[12px] flex items-center gap-3 font-medium text-slate-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 
                        {c}
                    </div>
                ))}
            </div>
            <div className="bg-emerald-900/40 p-5 rounded-2xl border border-white/5">
                <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.2em]">{review.encouragement}</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default BioInsights;
