
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { analyzeFoodImage } from '../services/geminiService';
import { NutritionData } from '../types';

interface ScannerProps {
  canScan: boolean;
  onScanStart: () => void;
  onScanComplete: (data: NutritionData) => void;
  triggerPaywall: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ canScan, onScanStart, onScanComplete, triggerPaywall }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isAnalyzingLocal, setIsAnalyzingLocal] = useState(false);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    if (!canScan) {
      triggerPaywall();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Auto-play failed:", error);
          });
        }
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Camera access denied or error:", err);
      alert("Please allow camera access or ensure you are on a secure connection (HTTPS) to scan food.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canScan) {
      triggerPaywall();
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        processAnalysis(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const processAnalysis = async (base64: string) => {
    setIsAnalyzingLocal(true);
    onScanStart();
    try {
      const results = await analyzeFoodImage(base64);
      onScanComplete(results);
      stopCamera();
    } catch (err: any) {
      console.error("Analysis Error Details:", err);
      
      // GUIDELINE: If the request fails with 404 "Requested entity was not found", reset/re-prompt for key
      if (err.message?.includes("Requested entity was not found")) {
        (window as any).aistudio?.openSelectKey();
      } else {
        alert("AI Engine is calibrated for high-precision scans. Please ensure the food is well-lit and clearly visible.");
      }
      
      // Trigger scan completion with null or handle failure in App.tsx
      // For now we just reset scanning state
      window.dispatchEvent(new CustomEvent('scan-failed'));
    } finally {
      setIsAnalyzingLocal(false);
    }
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    const base64 = dataUrl.split(',')[1];

    processAnalysis(base64);
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-4 w-full">
      {!isCameraActive ? (
        <div className="w-full max-w-sm aspect-square bg-white rounded-[2.5rem] flex flex-col items-center justify-center border-4 border-dashed border-slate-200 shadow-sm animate-in fade-in zoom-in duration-500">
           <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
             </svg>
           </div>
           
           <div className="flex flex-col gap-3 w-full px-8">
             <button 
              onClick={startCamera}
              className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
             >
               Launch AI Lens
             </button>
             
             <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
             >
               Upload Food Photo
             </button>
             <input 
               type="file" 
               ref={fileInputRef} 
               className="hidden" 
               accept="image/*" 
               onChange={handleFileUpload} 
             />
           </div>
           
           <p className="mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Identify any food instantly</p>
        </div>
      ) : (
        <div className="relative w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted
            className="w-full aspect-[3/4] object-cover bg-black"
          />
          <canvas ref={canvasRef} className="hidden" />
          
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 border-2 border-white/30 rounded-[2rem] relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-xl" />
              <div className="absolute inset-x-0 h-0.5 bg-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-[scan_2s_ease-in-out_infinite]" />
            </div>
          </div>

          <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-8">
            <button 
              onClick={stopCamera}
              className="bg-black/50 text-white p-4 rounded-full backdrop-blur-md hover:bg-black/70 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <button 
              onClick={captureAndAnalyze}
              disabled={isAnalyzingLocal}
              className="bg-white p-1 rounded-full shadow-2xl active:scale-90 transition-transform disabled:opacity-50"
            >
               <div className="w-16 h-16 rounded-full border-4 border-emerald-600 flex items-center justify-center bg-white">
                  <div className="w-12 h-12 bg-emerald-600 rounded-full" />
               </div>
            </button>

            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-black/50 text-white p-4 rounded-full backdrop-blur-md hover:bg-black/70 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes scan {
          0%, 100% { top: 0%; }
          50% { top: 100%; }
        }
      `}</style>
    </div>
  );
};

export default Scanner;
