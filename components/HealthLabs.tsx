
import React, { useState, useRef } from 'react';
import { generateHealthPodcast, transformToHealthyMeal, decodePCM, decodeAudioData } from '../services/geminiService';
import { UserProfile } from '../types';

const HealthLabs: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [isPodcastLoading, setIsPodcastLoading] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformedImg, setTransformedImg] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  
  const audioContextRef = useRef<AudioContext | null>(null);

  const handleGeneratePodcast = async () => {
    setIsPodcastLoading(true);
    setStatus('Drafting script...');
    try {
      const base64 = await generateHealthPodcast(user, 'Current hydration and fiber intake');
      setStatus('Simulating voices...');
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      const ctx = audioContextRef.current;
      const buffer = await decodeAudioData(decodePCM(base64), ctx, 24000, 1);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
      setStatus('Playing Podcast...');
    } catch (err) {
      console.error(err);
      alert('Podcast failed. Check API limits.');
    } finally {
      setIsPodcastLoading(false);
    }
  };

  const handleTransformMeal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        setIsTransforming(true);
        try {
          const base64 = (reader.result as string).split(',')[1];
          const result = await transformToHealthyMeal(base64);
          setTransformedImg(result);
        } catch (err) {
          console.error(err);
          alert('Transformation failed.');
        } finally {
          setIsTransforming(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      {/* Podcast Studio */}
      <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(37,99,235,0.4)]">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
             </svg>
          </div>
          <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-2">NutriStudio AI</h3>
          <p className="text-slate-400 text-xs mb-8 px-6">Generate a 2-speaker audio briefing on your current health status using Gemini TTS.</p>
          
          <button 
            onClick={handleGeneratePodcast}
            disabled={isPodcastLoading}
            className="bg-white text-slate-900 px-8 py-3 rounded-2xl font-black text-sm shadow-xl hover:bg-slate-100 transition-all active:scale-95 disabled:opacity-50"
          >
            {isPodcastLoading ? 'Generating Audio...' : 'Generate My Briefing'}
          </button>
          
          {status && <p className="mt-4 text-[10px] font-bold text-blue-400 uppercase tracking-widest">{status}</p>}
        </div>
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Meal Transformation */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-black text-slate-800">Healthy Swap</h3>
            <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Image Transformation</p>
          </div>
          <div className="bg-emerald-100 text-emerald-600 p-3 rounded-2xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        </div>

        {transformedImg ? (
          <div className="space-y-6 animate-in zoom-in duration-500">
            <div className="rounded-3xl overflow-hidden shadow-xl border-4 border-emerald-50">
              <img src={transformedImg} className="w-full aspect-square object-cover" />
            </div>
            <button 
              onClick={() => setTransformedImg(null)}
              className="w-full bg-slate-100 text-slate-500 py-3 rounded-2xl font-bold text-sm"
            >
              Reset Swapper
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm text-slate-500 mb-8">Upload a "cheat meal" and let Gemini envision its healthiest equivalent.</p>
            <label className="block w-full bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-3xl py-12 cursor-pointer group hover:bg-emerald-100 transition-colors">
              <div className="text-emerald-500 flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs font-black uppercase tracking-widest">Select Meal Photo</span>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleTransformMeal} />
            </label>
            {isTransforming && <p className="mt-4 text-emerald-600 font-bold animate-pulse text-xs uppercase tracking-widest">Gemini is redrawing...</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthLabs;
