
import React, { useState } from 'react';
import { analyzeProgress } from '../services/geminiService';
import { ProgressReview } from '../types';

const ProgressTracker: React.FC = () => {
  const [beforeImg, setBeforeImg] = useState<string | null>(null);
  const [afterImg, setAfterImg] = useState<string | null>(null);
  const [review, setReview] = useState<ProgressReview | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
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

  const handleAnalyze = async () => {
    if (!beforeImg || !afterImg) return;
    setIsLoading(true);
    try {
      const result = await analyzeProgress(beforeImg, afterImg);
      setReview(result);
    } catch (err) {
      console.error(err);
      alert('AI analysis failed. Try different images.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <h2 className="text-xl font-black text-slate-800 mb-2">Progress Review</h2>
        <p className="text-sm text-slate-500 mb-8">AI analysis of your physical transformation.</p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Before Photo</span>
            <label className="block aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 cursor-pointer overflow-hidden relative">
              {beforeImg ? (
                <img src={`data:image/jpeg;base64,${beforeImg}`} className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              )}
              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'before')} />
            </label>
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">After Photo</span>
            <label className="block aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 cursor-pointer overflow-hidden relative">
              {afterImg ? (
                <img src={`data:image/jpeg;base64,${afterImg}`} className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              )}
              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'after')} />
            </label>
          </div>
        </div>

        <button 
          onClick={handleAnalyze}
          disabled={isLoading || !beforeImg || !afterImg}
          className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-emerald-100 disabled:opacity-50 transition-all active:scale-95"
        >
          {isLoading ? 'Analyzing Changes...' : 'Compare with Gemini'}
        </button>
      </div>

      {review && (
        <div className="bg-emerald-950 text-white p-8 rounded-[2rem] shadow-2xl animate-in slide-in-from-bottom duration-500">
          <div className="flex items-center gap-3 mb-6">
             <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
             </div>
             <h3 className="text-xl font-black italic tracking-tighter uppercase">AI Feedback</h3>
          </div>
          
          <p className="text-emerald-100 text-sm mb-8 leading-relaxed italic">"{review.summary}"</p>
          
          <div className="space-y-4 mb-8">
            <h4 className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Key Observations</h4>
            {review.changes.map((change, i) => (
              <div key={i} className="flex gap-3 text-sm text-emerald-50">
                <span className="text-emerald-500 font-bold">•</span>
                <span>{change}</span>
              </div>
            ))}
          </div>

          <div className="bg-emerald-900/50 p-6 rounded-2xl border border-emerald-500/20">
            <p className="text-xs font-medium text-emerald-200">{review.encouragement}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;
