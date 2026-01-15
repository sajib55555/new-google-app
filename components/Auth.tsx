
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      alert(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] bg-slate-950 flex flex-col items-center justify-center p-8 animate-in fade-in duration-700">
      <div className="w-full max-w-sm space-y-12">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-[0_20px_50px_rgba(16,185,129,0.3)]">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
             </svg>
          </div>
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">NutriSnap</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em]">Neural Health Architecture</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
             <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">Email</label>
             <input 
               type="email" 
               placeholder="Enter your email"
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               className="w-full bg-white/5 border-2 border-white/5 rounded-2xl p-5 text-white font-bold outline-none focus:border-emerald-500/30 transition-all"
             />
          </div>
          <div className="space-y-2">
             <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">Password</label>
             <input 
               type="password" 
               placeholder="••••••••"
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               className="w-full bg-white/5 border-2 border-white/5 rounded-2xl p-5 text-white font-bold outline-none focus:border-emerald-500/30 transition-all"
             />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-white text-slate-950 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-2xl active:scale-95 transition-all hover:bg-emerald-50 mt-4"
          >
            {loading ? 'Processing...' : isSignUp ? 'Sign up' : 'Log in'}
          </button>
        </form>

        <div className="text-center">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-white transition-colors"
          >
            {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
      
      <div className="absolute bottom-12 text-[8px] font-black text-slate-700 uppercase tracking-[0.4em]">
        Secured by Supabase Cloud Infrastructure
      </div>
    </div>
  );
};

export default Auth;
