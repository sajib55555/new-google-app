
import React, { useState } from 'react';
import { searchFoodFact } from '../services/geminiService';

const FactChecker: React.FC = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<{ text: string, sources: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      const data = await searchFoodFact(query);
      setResult(data);
    } catch (err) {
      console.error(err);
      alert('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-black text-slate-800 mb-2">Food Fact Checker</h2>
        <p className="text-sm text-slate-500 mb-6">Ask about trending diets, food recalls, or health claims.</p>
        
        <form onSubmit={handleSearch} className="relative">
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Is ashwagandha safe daily?"
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-12 transition-all"
          />
          <button 
            type="submit"
            disabled={isLoading}
            className="absolute right-3 top-3 bg-emerald-600 text-white p-2 rounded-xl disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </form>
      </div>

      {result && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 animate-in slide-in-from-bottom duration-300">
          <div className="prose prose-sm text-slate-700 leading-relaxed">
            {result.text}
          </div>
          
          {result.sources.length > 0 && (
            <div className="pt-6 border-t border-slate-100">
              <h4 className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Verified Sources</h4>
              <div className="space-y-2">
                {result.sources.map((source, i) => (
                  <a 
                    key={i} 
                    href={source.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between bg-slate-50 p-3 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <span className="text-xs font-medium text-slate-600 truncate mr-4">{source.title}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FactChecker;
