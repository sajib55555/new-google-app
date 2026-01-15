
import React, { useState } from 'react';
import { findSubstitution } from '../services/geminiService';
import { Substitution } from '../types';

const SwapEngine: React.FC = () => {
  const [ingredient, setIngredient] = useState('');
  const [diet, setDiet] = useState('Healthy');
  const [result, setResult] = useState<Substitution | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingredient.trim()) return;
    setIsLoading(true);
    try {
      const res = await findSubstitution(ingredient, diet);
      setResult(res);
    } catch (err) {
      console.error(err);
      alert('Search failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const diets = ['Healthy', 'Keto', 'Vegan', 'Gluten-Free', 'Low-Carb', 'Nut-Free'];

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <h2 className="text-xl font-black text-slate-800 mb-1">Ingredient Swapper</h2>
        <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-6">Bio-Optimization Tool</p>

        <form onSubmit={handleSwap} className="space-y-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder="e.g. All-purpose flour"
              value={ingredient}
              onChange={e => setIngredient(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
            {diets.map(d => (
              <button 
                key={d}
                type="button"
                onClick={() => setDiet(d)}
                className={`flex-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  diet === d ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-400'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm uppercase shadow-xl transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoading ? 'Searching Swaps...' : 'Find Alternative'}
          </button>
        </form>
      </div>

      {result && (
        <div className="bg-emerald-600 text-white p-8 rounded-[2rem] shadow-2xl animate-in zoom-in duration-300">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 bg-white/10 p-4 rounded-2xl text-center">
              <span className="text-[8px] font-black uppercase text-white/50 block mb-1">Original</span>
              <p className="text-sm font-bold truncate">{result.original}</p>
            </div>
            <div className="text-white/40">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
            <div className="flex-1 bg-white p-4 rounded-2xl text-center text-emerald-600">
              <span className="text-[8px] font-black uppercase text-emerald-600/50 block mb-1">Replacement</span>
              <p className="text-sm font-black truncate">{result.replacement}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-[10px] font-black uppercase text-white/60 mb-2 tracking-widest">Why it works</h4>
              <p className="text-sm leading-relaxed font-medium">{result.benefits}</p>
            </div>
            <div className="bg-black/10 p-4 rounded-2xl border border-white/10">
              <h4 className="text-[10px] font-black uppercase text-white/60 mb-1 tracking-widest">Macro Delta</h4>
              <p className="text-xs italic">"{result.macros_diff}"</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SwapEngine;
