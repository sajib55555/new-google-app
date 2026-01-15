
import React from 'react';

interface PaywallProps {
  onBuyMonthly: () => void;
  onBuyYearly: () => void;
  onRestore: () => void;
  isLoading: boolean;
  onClose: () => void;
}

const Paywall: React.FC<PaywallProps> = ({ onBuyMonthly, onBuyYearly, onRestore, isLoading, onClose }) => {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-500 border border-white/20">
        <div className="h-56 bg-gradient-to-br from-indigo-900 via-slate-900 to-black flex items-center justify-center relative">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors bg-white/10 p-2 rounded-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="text-center p-8">
            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-[0.4em] mb-3 block">Architect Elite</span>
            <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">Unlock Peak Potential</h2>
            <p className="text-indigo-200 text-xs font-medium opacity-80">Unlimited Intelligence for the Human Machine.</p>
          </div>
        </div>

        <div className="p-8 space-y-6 bg-white">
          <div className="grid grid-cols-1 gap-4">
             <FeatureItem text="Unlimited AI Food Scans" subtitle="Exhaust your goals, not your limits" />
             <FeatureItem text="NutriVision Live Coach" subtitle="Real-time voice & vision feedback" />
             <FeatureItem text="Fridge Architect" subtitle="AI Inventory Analysis & Recipes" />
             <FeatureItem text="Transformation AI" subtitle="Biometric Progress Auditing" />
          </div>

          <div className="grid gap-4 mt-8">
            <button 
              onClick={onBuyYearly}
              disabled={isLoading}
              className="relative bg-slate-900 text-white rounded-[2rem] p-6 flex justify-between items-center hover:scale-[1.02] transition-all active:scale-95 group border-2 border-emerald-500/30"
            >
              <div className="text-left">
                <span className="block text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1">Elite Value • Save 15%</span>
                <span className="block text-xl font-black italic uppercase tracking-tighter">Yearly Sync</span>
              </div>
              <div className="text-right">
                <span className="block text-2xl font-black text-white leading-none">£49.95</span>
                <span className="block text-[10px] text-slate-400 font-bold uppercase">per year</span>
              </div>
            </button>

            <button 
              onClick={onBuyMonthly}
              disabled={isLoading}
              className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6 flex justify-between items-center hover:bg-slate-100 transition-all active:scale-95"
            >
              <div className="text-left">
                <span className="block text-lg font-black italic text-slate-800 uppercase tracking-tighter">Monthly Plan</span>
              </div>
              <div className="text-right">
                <span className="block text-xl font-black text-slate-800 leading-none">£4.95</span>
                <span className="block text-[10px] text-slate-400 font-bold uppercase">per month</span>
              </div>
            </button>
          </div>

          <div className="text-center space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">
               Recurring Billing • Instant Access • Cancel Anytime
            </p>
            <button 
              onClick={onRestore}
              className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
            >
              Restore Previous License
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureItem: React.FC<{ text: string; subtitle: string }> = ({ text, subtitle }) => (
  <div className="flex items-start gap-4 p-2">
    <div className="mt-1 h-5 w-5 rounded-lg bg-emerald-100 flex items-center justify-center flex-none">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    </div>
    <div>
      <h4 className="text-sm font-black text-slate-800 italic uppercase tracking-tight leading-none mb-1">{text}</h4>
      <p className="text-[10px] text-slate-400 font-medium">{subtitle}</p>
    </div>
  </div>
);

export default Paywall;
