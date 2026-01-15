
import React, { useState, useRef } from 'react';
import { analyzePantry } from '../services/geminiService';
import { PantryReport } from '../types';

const PantryScanner: React.FC = () => {
  const [report, setReport] = useState<PantryReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error(err);
      alert('Camera failed.');
    }
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const base64 = canvas.toDataURL('image/jpeg').split(',')[1];
      setIsLoading(true);
      try {
        const result = await analyzePantry(base64);
        setReport(result);
        stopCamera();
      } catch (err) {
        console.error(err);
        alert('Analysis failed.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(t => t.stop());
    setIsCameraActive(false);
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      {!isCameraActive && !report && (
        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden text-center">
          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-2xl font-black italic uppercase mb-2">Smart Kitchen</h3>
          <p className="text-slate-400 text-xs mb-8">Scan your fridge or pantry to get a health grade and meal suggestions based on what you have.</p>
          <button onClick={startCamera} className="bg-emerald-500 text-white px-8 py-3 rounded-2xl font-black text-sm shadow-xl transition-all active:scale-95">
            Audit My Kitchen
          </button>
        </div>
      )}

      {isCameraActive && (
        <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl aspect-[3/4]">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover bg-black" />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute inset-x-0 bottom-8 flex justify-center gap-6">
            <button onClick={stopCamera} className="bg-black/50 p-4 rounded-full text-white backdrop-blur-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <button onClick={captureAndAnalyze} className="bg-white p-6 rounded-full shadow-xl active:scale-90 transition-transform">
              <div className="w-8 h-8 rounded-full border-4 border-emerald-600" />
            </button>
          </div>
          {isLoading && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
              <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="font-bold">Analyzing Inventory...</p>
            </div>
          )}
        </div>
      )}

      {report && (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 flex items-center justify-center text-6xl font-black opacity-10 italic ${
              report.grade === 'A' ? 'text-emerald-500' : report.grade === 'B' ? 'text-blue-500' : 'text-amber-500'
            }`}>
              {report.grade}
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-1 italic">Audit Results</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Kitchen Grade: <span className="text-emerald-600">{report.grade}</span></p>

            <div className="space-y-4 mb-8">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Items Detected</h4>
              <div className="flex flex-wrap gap-2">
                {report.items_found.map((item, i) => (
                  <span key={i} className="bg-slate-50 text-slate-600 px-3 py-1 rounded-full text-xs font-medium border border-slate-100">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
              <h4 className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] mb-3">AI Recommendation</h4>
              <p className="text-sm text-emerald-800 leading-relaxed italic">"{report.top_recommendations[0]}"</p>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl">
            <h4 className="text-[10px] font-black uppercase text-emerald-400 tracking-[0.2em] mb-2">Pantry Recipe Challenge</h4>
            <h3 className="text-xl font-bold mb-4">{report.suggested_recipe.name}</h3>
            <div className="space-y-2 mb-6">
              {report.suggested_recipe.ingredients.map((ing, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-slate-400">
                  <div className="w-1 h-1 rounded-full bg-emerald-500" />
                  {ing}
                </div>
              ))}
            </div>
            <button onClick={() => setReport(null)} className="w-full bg-white/10 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-white/20">
              New Scan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PantryScanner;
