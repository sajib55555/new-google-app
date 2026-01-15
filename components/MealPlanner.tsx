
import React, { useState, useRef } from 'react';
import { generateMealPlan, generateShoppingList, analyzePantry, generateMealPlanFromIngredients, generateWorkout } from '../services/geminiService';
import { UserProfile, MealPlan, GroceryCategory, PantryReport, WorkoutPlan } from '../types';

interface MealPlannerProps {
  user: UserProfile;
  currentCals: number;
  triggerPaywall: () => void;
}

const MealPlanner: React.FC<MealPlannerProps> = ({ user, currentCals, triggerPaywall }) => {
  // Goal-based state
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [shoppingList, setShoppingList] = useState<GroceryCategory[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isListLoading, setIsListLoading] = useState(false);

  // Fridge-based state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isPantryLoading, setIsPantryLoading] = useState(false);
  const [pantryReport, setPantryReport] = useState<PantryReport | null>(null);
  const [fridgeMealPlan, setFridgeMealPlan] = useState<MealPlan | null>(null);
  const [isFridgePlanLoading, setIsFridgePlanLoading] = useState(false);

  // Body Architect state
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [isWorkoutLoading, setIsWorkoutLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setShoppingList(null);
    setFridgeMealPlan(null);
    try {
      const newPlan = await generateMealPlan(user);
      setPlan(newPlan);
    } catch (err) {
      console.error(err);
      alert('Failed to generate plan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateList = async () => {
    if (!plan) return;
    setIsListLoading(true);
    try {
      const list = await generateShoppingList(plan);
      setShoppingList(list);
    } catch (err) {
      console.error(err);
      alert('Failed to generate shopping list.');
    } finally {
      setIsListLoading(false);
    }
  };

  const handleGenerateWorkout = async () => {
    setIsWorkoutLoading(true);
    try {
      const diff = user.goals.calories - currentCals;
      const result = await generateWorkout(user, diff);
      setWorkoutPlan(result);
    } catch (err) {
      console.error(err);
      alert('Fitness engine offline.');
    } finally {
      setIsWorkoutLoading(false);
    }
  };

  const startCamera = async () => {
    if (!user.is_pro) {
      triggerPaywall();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Camera failed:", err);
      alert("Please allow camera access to scan your fridge.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const captureFridge = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      processPantryAnalysis(base64);
    }
  };

  const handlePantryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user.is_pro) {
      triggerPaywall();
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        processPantryAnalysis(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const processPantryAnalysis = async (base64: string) => {
    setIsPantryLoading(true);
    stopCamera();
    try {
      const report = await analyzePantry(base64);
      setPantryReport(report);
      setFridgeMealPlan(null);
      setPlan(null);
    } catch (err) {
      console.error(err);
      alert("Failed to analyze fridge contents.");
    } finally {
      setIsPantryLoading(false);
    }
  };

  const generateFridgePlan = async () => {
    if (!pantryReport) return;
    setIsFridgePlanLoading(true);
    try {
      const plan = await generateMealPlanFromIngredients(pantryReport.items_found, user);
      setFridgeMealPlan(plan);
    } catch (err) {
      console.error(err);
      alert("Failed to generate fridge-based plan.");
    } finally {
      setIsFridgePlanLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-24">
      {/* 1. Goal Protocol Section */}
      <section className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tighter uppercase italic">Goal Protocol</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Target: {user.goals.calories} kcal</p>
            </div>
          </div>

          {!plan && !pantryReport && (
            <button 
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-900 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              {isLoading ? <LoadingSpinner /> : <>Generate Protocol</>}
            </button>
          )}

          {plan && (
            <div className="space-y-4 animate-in slide-in-from-top duration-300">
              <div className="flex gap-2">
                <button onClick={handleGenerate} className="flex-1 bg-white/5 text-slate-300 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest border border-white/10">Regen</button>
                <button onClick={handleGenerateList} disabled={isListLoading} className="flex-[2] bg-emerald-600 text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-900">
                  {isListLoading ? <LoadingSpinner size="h-4 w-4" /> : "Shopping List"}
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
      </section>

      {/* 2. Fridge Architect Section */}
      <section className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30 relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              {!user.is_pro && (
                <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5 border border-slate-900">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-2 w-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tighter uppercase italic">Fridge Architect</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{user.is_pro ? 'AI Inventory Analysis' : 'Elite Feature • Upgrade Required'}</p>
            </div>
          </div>

          {!isCameraActive && !pantryReport && !isPantryLoading && (
            <div className="space-y-3">
              <button 
                onClick={startCamera}
                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 ${user.is_pro ? 'bg-emerald-500 text-white shadow-emerald-900' : 'bg-slate-800 text-slate-400'}`}
              >
                Scan My Fridge
              </button>
              <button 
                onClick={() => user.is_pro ? fileInputRef.current?.click() : triggerPaywall()}
                className="w-full bg-white/5 text-white/60 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5"
              >
                Upload Photo
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePantryUpload} />
            </div>
          )}

          {isCameraActive && (
            <div className="relative rounded-[2rem] overflow-hidden bg-black aspect-video mb-6">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-32 border-2 border-emerald-500/30 rounded-2xl relative animate-pulse" />
              </div>
              <div className="absolute inset-x-0 bottom-4 flex justify-center gap-4 px-4">
                <button onClick={stopCamera} className="bg-white/10 p-4 rounded-full backdrop-blur-md">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <button onClick={captureFridge} className="bg-white text-slate-900 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  Capture Fridge
                </button>
              </div>
            </div>
          )}

          {isPantryLoading && (
            <div className="text-center py-12 space-y-4">
               <LoadingSpinner size="h-12 w-12" />
               <p className="text-emerald-400 font-black text-xs uppercase tracking-[0.2em] animate-pulse">Inventorying Food...</p>
            </div>
          )}

          {pantryReport && !isPantryLoading && (
            <div className="space-y-8 animate-in fade-in duration-500">
               {/* Analysis Result */}
               <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block mb-1">Health Grade</span>
                    <span className={`text-4xl font-black italic ${pantryReport.grade === 'A' ? 'text-emerald-400' : 'text-amber-400'}`}>{pantryReport.grade}</span>
                  </div>
                  <button 
                    onClick={generateFridgePlan}
                    disabled={isFridgePlanLoading}
                    className="bg-emerald-500 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-900 active:scale-95 flex items-center gap-2"
                  >
                    {isFridgePlanLoading ? <LoadingSpinner size="h-4 w-4" /> : "Generate 5 Meals"}
                  </button>
               </div>

               {/* Detected Items Chips */}
               <div>
                  <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4">Detected Inventory</h4>
                  <div className="flex flex-wrap gap-2">
                    {pantryReport.items_found.map((item, i) => (
                      <span key={i} className="bg-white/10 px-3 py-2 rounded-xl text-[10px] font-bold text-slate-300 border border-white/5 capitalize">
                        {item}
                      </span>
                    ))}
                  </div>
               </div>

               <button 
                onClick={() => { setPantryReport(null); setFridgeMealPlan(null); }}
                className="w-full text-slate-500 text-[10px] font-black uppercase tracking-widest py-2 hover:text-slate-300"
               >
                 New Fridge Scan
               </button>
            </div>
          )}
        </div>
      </section>

      {/* 3. Body Architect Section */}
      <section className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center border border-indigo-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tighter uppercase italic">Body Architect</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sync FIT with Plan</p>
            </div>
          </div>

          <button 
            onClick={handleGenerateWorkout}
            disabled={isWorkoutLoading}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-900 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            {isWorkoutLoading ? <LoadingSpinner /> : <>Calibrate Workout</>}
          </button>
        </div>

        {workoutPlan && (
          <div className="mt-8 space-y-4 animate-in slide-in-from-top duration-500">
             {workoutPlan.exercises.map((ex, i) => (
                <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/5">
                   <div className="flex justify-between items-center mb-1">
                      <h4 className="font-bold text-indigo-400">{ex.name}</h4>
                      <span className="text-[10px] font-black text-slate-500 uppercase">{ex.duration}</span>
                   </div>
                   <p className="text-[11px] text-slate-400">{ex.instructions}</p>
                </div>
             ))}
          </div>
        )}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
      </section>

      {/* Results Display Area (Unified Dark Style) */}
      <div className="space-y-4 px-2">
        {/* Shopping List Result */}
        {shoppingList && (
          <div className="bg-slate-900 p-8 rounded-[3rem] border border-white/5 shadow-2xl animate-in slide-in-from-top duration-300">
             <div className="flex justify-between items-center mb-6">
               <h4 className="text-lg font-black text-white italic uppercase tracking-tighter">Grocery Matrix</h4>
               <button onClick={() => setShoppingList(null)} className="text-slate-400 p-2 bg-white/5 rounded-full hover:bg-white/10">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
             </div>
             <div className="space-y-8">
                {shoppingList.map((cat, i) => (
                  <div key={i}>
                    <h5 className="text-[9px] font-black uppercase text-emerald-500 mb-3 tracking-widest">{cat.category}</h5>
                    <ul className="space-y-3">
                      {cat.items.map((item, j) => (
                        <li key={j} className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-lg border-2 border-white/10 bg-white/5" />
                          <span className="text-xs font-medium text-slate-300">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* Regular 4-meal plan result */}
        {plan && !shoppingList && (
          <div className="space-y-4 animate-in slide-in-from-bottom duration-500">
            {plan.meals.map((meal, idx) => (
              <MealCard key={idx} meal={meal} />
            ))}
            <div className="bg-emerald-950 text-white p-6 rounded-[2rem] shadow-xl border border-white/5">
               <span className="text-[8px] font-black uppercase text-emerald-500 tracking-widest block mb-2">Pro Tip</span>
               <p className="text-xs font-medium italic leading-relaxed">"{plan.daily_tip}"</p>
            </div>
          </div>
        )}

        {/* Fridge-based 5-meal plan result */}
        {fridgeMealPlan && (
          <div className="space-y-4 animate-in slide-in-from-bottom duration-500">
            <div className="px-2 flex justify-between items-center mb-2">
              <h4 className="text-lg font-black text-slate-800 italic uppercase">Fridge-to-Plate Plan</h4>
              <span className="text-[8px] font-black bg-emerald-100 text-emerald-600 px-2 py-1 rounded-full uppercase">5 Creations</span>
            </div>
            {fridgeMealPlan.meals.map((meal, idx) => (
              <MealCard key={idx} meal={meal} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const MealCard: React.FC<{ meal: any }> = ({ meal }) => (
  <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-white/5 shadow-2xl flex gap-5 hover:border-emerald-500/20 transition-all group">
    <div className="flex-none">
      <div className="w-14 h-14 bg-white/5 rounded-2xl flex flex-col items-center justify-center border border-white/5">
        <span className="text-[9px] font-black uppercase tracking-tighter leading-none text-slate-500 mb-0.5">{meal.time?.split(' ')?.[1] || 'MEAL'}</span>
        <span className="text-xl font-black text-emerald-400 leading-none">{meal.time?.split(' ')?.[0] || '1'}</span>
      </div>
    </div>
    <div className="flex-1">
      <div className="flex justify-between items-start mb-1">
        <h4 className="font-bold text-white text-base group-hover:text-emerald-400 transition-colors">{meal.title}</h4>
        <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full uppercase border border-emerald-400/20">{meal.calories} kcal</span>
      </div>
      <p className="text-[12px] text-slate-400 mb-4 leading-relaxed font-medium">{meal.description}</p>
      <div className="flex gap-5">
        <MacroMini label="P" val={meal.macros.p} color="text-emerald-400" />
        <MacroMini label="C" val={meal.macros.c} color="text-blue-400" />
        <MacroMini label="F" val={meal.macros.f} color="text-amber-400" />
      </div>
    </div>
  </div>
);

const MacroMini: React.FC<{ label: string, val: number, color: string }> = ({ label, val, color }) => (
  <div className="flex items-center gap-1.5">
    <span className={`text-[10px] font-black ${color}`}>{label}</span>
    <span className="text-[11px] font-bold text-slate-500">{val}g</span>
  </div>
);

const LoadingSpinner = ({ size = "h-5 w-5" }: { size?: string }) => (
  <div className={`${size} border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin`} />
);

export default MealPlanner;
