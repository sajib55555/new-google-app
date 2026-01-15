
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Scanner from './components/Scanner';
import Community from './components/Community';
import Paywall from './components/Paywall';
import MealPlanner from './components/MealPlanner';
import Coach from './components/Coach';
import NearbyRestaurants from './components/NearbyRestaurants';
import BioInsights from './components/BioInsights';
import Onboarding from './components/Onboarding';
import Settings from './components/Settings';
import Auth from './components/Auth';
import { UserProfile, NutritionData, Post, Restaurant } from './types';
import { useSubscription } from './hooks/useSubscription';
import { findHealthyNearby, speakNutritionSummary, decodePCM, decodeAudioData } from './services/geminiService';
import { supabase } from './services/supabaseClient';

type Tab = 'dashboard' | 'scan' | 'planner' | 'community' | 'insights';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [showPaywall, setShowPaywall] = useState(false);
  const [showCoach, setShowCoach] = useState(false);
  const [showRestaurants, setShowRestaurants] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isScanningGlobal, setIsScanningGlobal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);
  
  const [lastScanResult, setLastScanResult] = useState<NutritionData | null>(null);
  const [communityPosts, setCommunityPosts] = useState<Post[]>([]);
  const [nearbyResults, setNearbyResults] = useState<Restaurant[]>([]);

  const audioContextRef = useRef<AudioContext | null>(null);

  // Profile and Data State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [scanHistory, setScanHistory] = useState<NutritionData[]>([]);
  const [waterIntake, setWaterIntake] = useState(0);

  // 1. Monitor Auth State
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Fetch User Profile and Data when Session is active
  useEffect(() => {
    if (!session) {
      setUser(null);
      setScanHistory([]);
      setWaterIntake(0);
      setCommunityPosts([]);
      setIsSyncing(false);
      return;
    }

    const fetchData = async () => {
      setIsSyncing(true);
      const today = new Date().toDateString();

      try {
        // Fetch Profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile) {
          const isNewDay = profile.last_scan_date !== today;
          setUser({
            id: profile.id,
            name: profile.name || '',
            onboarded: !!profile.name,
            scan_count: profile.scan_count || 0,
            daily_scan_count: isNewDay ? 0 : (profile.daily_scan_count || 0),
            last_scan_date: profile.last_scan_date || today,
            is_pro: profile.is_pro || false,
            dietary_preference: profile.dietary_preference || 'No Preference',
            activity_level: profile.activity_level || 'Moderately Active',
            goals: {
              calories: profile.calories_goal || 2000,
              protein: 150, carbs: 200, fat: 70, water_ml: 2500,
              primary_objective: profile.primary_objective || 'Weight Loss'
            },
            stats: { weight: profile.weight || 70, height: profile.height || 175, age: profile.age || 25 }
          });
        }

        // Fetch History
        const { data: history, error: historyErr } = await supabase
          .from('nutrition_history')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (history) {
          setScanHistory(history.map(h => ({
            calories: h.calories,
            protein: h.protein, carbs: h.carbs, fat: h.fat,
            verdict: h.verdict, health_score: h.health_score, scanned_image: h.scanned_image, motivation: h.motivation,
            key_nutrients: h.nutrients || [],
            timestamp: new Date(h.created_at).getTime(),
            health_benefits: h.health_benefits || [],
            harmful_warnings: h.harmful_warnings || [],
            nova_score: h.nova_score || 0,
            is_ultra_processed: h.is_ultra_processed || false
          })));
        }

        // Fetch Community Posts - Handle missing table error gracefully
        const { data: posts, error: postFetchErr } = await supabase
          .from('community_posts')
          .select('*')
          .order('created_at', { ascending: false });

        if (posts) {
          setCommunityPosts(posts.map(p => ({
            id: p.id, user_id: p.user_id, user_name: p.user_name, user_avatar: p.user_avatar, image_url: p.image_url,
            caption: p.caption, likes: p.likes || 0,
            timestamp: new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date(p.created_at).toLocaleDateString(),
            nutrition_summary: p.nutrition_summary
          })));
        } else if (postFetchErr) {
          console.warn("Community feed unavailable on cloud. Switching to local session cache.");
        }

        // Fetch Water
        const todayISO = new Date().toISOString().split('T')[0];
        const { data: water } = await supabase
          .from('water_logs')
          .select('amount')
          .eq('user_id', session.user.id)
          .eq('log_date', todayISO);

        if (water) {
          setWaterIntake(water.reduce((sum, w) => sum + w.amount, 0));
        }
      } catch (err) {
        console.error("Critical Sync Error:", err);
      } finally {
        setIsSyncing(false);
      }
    };

    fetchData();
  }, [session]);

  const currentCals = useMemo(() => {
    const todayStr = new Date().toDateString();
    return scanHistory
      .filter(item => item.timestamp && new Date(item.timestamp).toDateString() === todayStr)
      .reduce((sum, item) => sum + item.calories, 0);
  }, [scanHistory]);

  const setIsPro = useCallback(async (val: boolean) => {
    if (!session) return;
    const { error } = await supabase.from('profiles').update({ is_pro: val }).eq('id', session.user.id);
    if (!error) setUser(prev => prev ? { ...prev, is_pro: val } : null);
  }, [session]);

  const sub = useSubscription(user?.is_pro || false, setIsPro);

  const handleAddWater = useCallback(async (amt: number) => {
    if (!session) return;
    setWaterIntake(prev => prev + amt);
    await supabase.from('water_logs').insert({ user_id: session.user.id, amount: amt });
  }, [session]);

  const handleOnboardingComplete = async (profile: UserProfile) => {
    if (!session) return;
    const { error } = await supabase.from('profiles').upsert({
      id: session.user.id, name: profile.name, weight: profile.stats.weight, height: profile.stats.height,
      age: profile.stats.age, calories_goal: profile.goals.calories, dietary_preference: profile.dietary_preference,
      activity_level: profile.activity_level, is_pro: false
    });
    if (!error) setUser({ ...profile, onboarded: true });
  };

  const handleUpdateProfile = async (profile: UserProfile) => {
    if (!session) return;
    const { error } = await supabase.from('profiles').update({
      name: profile.name, weight: profile.stats.weight, height: profile.stats.height,
      age: profile.stats.age, calories_goal: profile.goals.calories, dietary_preference: profile.dietary_preference,
      activity_level: profile.activity_level
    }).eq('id', session.user.id);
    if (!error) setUser(profile);
  };

  const handleResetProfile = async () => {
    await supabase.auth.signOut();
    window.location.replace('/'); 
  };

  const openCoach = useCallback(() => {
    if (!user?.is_pro) setShowPaywall(true);
    else setShowCoach(true);
  }, [user]);

  const canUserScan = useMemo(() => {
    if (user?.is_pro) return true;
    const today = new Date().toDateString();
    if (user?.last_scan_date !== today) return true;
    return (user?.daily_scan_count || 0) < 3;
  }, [user]);

  const handleScanComplete = async (data: NutritionData) => {
    if (!session || !user) return;
    setLastScanResult(data);
    setIsScanningGlobal(false);
    setShowResultModal(true);
    playVoiceFeedback(data);

    const today = new Date().toDateString();
    const currentDaily = user.last_scan_date === today ? (user.daily_scan_count || 0) : 0;
    const newDailyCount = currentDaily + 1;
    const newTotalCount = (user.scan_count || 0) + 1;

    await supabase.from('profiles').update({
      scan_count: newTotalCount, daily_scan_count: newDailyCount, last_scan_date: today
    }).eq('id', session.user.id);

    setUser(prev => prev ? ({
      ...prev, scan_count: newTotalCount, daily_scan_count: newDailyCount, last_scan_date: today
    }) : null);
  };

  const playVoiceFeedback = async (data: NutritionData) => {
    try {
      const base64 = await speakNutritionSummary(data);
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();
      const buffer = await decodeAudioData(decodePCM(base64), ctx, 24000, 1);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
    } catch (e) {
      console.error(e);
    }
  };

  const logMeal = useCallback(async () => {
    if (!lastScanResult || !session) return;
    const now = Date.now();
    const newLog = { ...lastScanResult, timestamp: now };
    
    // Add to local state first (Optimistic)
    setScanHistory(prev => [newLog, ...prev]);
    setLastScanResult(null);
    setShowResultModal(false);
    setActiveTab('dashboard');

    const { error } = await supabase.from('nutrition_history').insert({
      user_id: session.user.id,
      calories: lastScanResult.calories,
      protein: lastScanResult.protein,
      carbs: lastScanResult.carbs,
      fat: lastScanResult.fat,
      verdict: lastScanResult.verdict,
      health_score: lastScanResult.health_score,
      scanned_image: lastScanResult.scanned_image,
      motivation: lastScanResult.motivation,
      nutrients: lastScanResult.key_nutrients || []
    });

    if (error) {
      console.warn("Cloud log failed, kept local copy:", JSON.stringify(error));
    }
  }, [lastScanResult, session]);

  const shareToCommunity = useCallback(async () => {
    if (!lastScanResult || !user || !session) return;
    
    const summary = {
      calories: lastScanResult.calories,
      protein: lastScanResult.protein,
      carbs: lastScanResult.carbs,
      fat: lastScanResult.fat,
      verdict: lastScanResult.verdict
    };

    // OPTIMISTIC LOCAL UPDATE
    const tempId = 'temp-' + Date.now();
    const formattedPost: Post = {
      id: tempId,
      user_id: session.user.id,
      user_name: user.name || 'Architect',
      user_avatar: `https://picsum.photos/seed/${session.user.id}/100/100`,
      image_url: lastScanResult.scanned_image || '',
      caption: `Biometric scan complete: ${lastScanResult.verdict}! 🥗`,
      likes: 0,
      timestamp: 'Just now',
      nutrition_summary: summary
    };
    
    setCommunityPosts(prev => [formattedPost, ...prev]);
    setLastScanResult(null);
    setShowResultModal(false);
    setActiveTab('community');

    // ATTEMPT CLOUD SYNC
    const { data: newPost, error } = await supabase.from('community_posts').insert({
      user_id: session.user.id,
      user_name: user.name || 'Architect',
      user_avatar: `https://picsum.photos/seed/${session.user.id}/100/100`,
      image_url: lastScanResult.scanned_image,
      caption: formattedPost.caption,
      likes: 0,
      nutrition_summary: summary
    }).select().single();

    if (error) {
      console.warn("Cloud share table not found or unavailable. Post remains in local session feed.");
      console.debug("Post error details:", JSON.stringify(error));
    } else if (newPost) {
      // Update temp ID with real DB ID
      setCommunityPosts(prev => prev.map(p => p.id === tempId ? { ...p, id: newPost.id } : p));
    }
  }, [lastScanResult, user, session]);

  const logAndShareMeal = async () => {
    if (!lastScanResult || !user || !session) return;
    
    // 1. Log locally
    const now = Date.now();
    const newLog = { ...lastScanResult, timestamp: now };
    setScanHistory(prev => [newLog, ...prev]);

    // 2. Share optimistically
    const summary = {
      calories: lastScanResult.calories,
      protein: lastScanResult.protein,
      carbs: lastScanResult.carbs,
      fat: lastScanResult.fat,
      verdict: lastScanResult.verdict
    };

    const formattedPost: Post = {
      id: 'temp-' + now,
      user_id: session.user.id,
      user_name: user.name || 'Architect',
      user_avatar: `https://picsum.photos/seed/${session.user.id}/100/100`,
      image_url: lastScanResult.scanned_image || '',
      caption: `Logged and shared! Verdict: ${lastScanResult.verdict} 🧬`,
      likes: 0,
      timestamp: 'Just now',
      nutrition_summary: summary
    };
    
    setCommunityPosts(prev => [formattedPost, ...prev]);
    
    // Attempt cloud log
    supabase.from('nutrition_history').insert({
      user_id: session.user.id,
      calories: lastScanResult.calories,
      protein: lastScanResult.protein,
      carbs: lastScanResult.carbs,
      fat: lastScanResult.fat,
      verdict: lastScanResult.verdict,
      health_score: lastScanResult.health_score,
      scanned_image: lastScanResult.scanned_image,
      motivation: lastScanResult.motivation,
      nutrients: lastScanResult.key_nutrients || []
    }).then(({ error }) => {
       if (error) console.warn("Log sync failed:", JSON.stringify(error));
    });

    // Attempt cloud share
    supabase.from('community_posts').insert({
      user_id: session.user.id,
      user_name: user.name || 'Architect',
      user_avatar: `https://picsum.photos/seed/${session.user.id}/100/100`,
      image_url: lastScanResult.scanned_image,
      caption: formattedPost.caption,
      likes: 0,
      nutrition_summary: summary
    }).select().single().then(({ data: newPost, error }) => {
       if (error) {
         console.warn("Share sync failed (table likely missing):", JSON.stringify(error));
       } else if (newPost) {
         setCommunityPosts(prev => prev.map(p => p.id === formattedPost.id ? { ...p, id: newPost.id } : p));
       }
    });

    setLastScanResult(null);
    setShowResultModal(false);
    setActiveTab('community');
  };

  const handleLikePost = async (postId: string) => {
    const post = communityPosts.find(p => p.id === postId);
    if (!post) return;
    const newLikes = post.likes + 1;
    setCommunityPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: newLikes } : p));
    if (!postId.startsWith('temp-')) {
       await supabase.from('community_posts').update({ likes: newLikes }).eq('id', postId);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    setCommunityPosts(prev => prev.filter(p => p.id !== postId));
    if (!postId.startsWith('temp-')) {
       await supabase.from('community_posts').delete().eq('id', postId);
    }
  };

  if (!session) return <Auth />;
  if (isSyncing) return <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center"><div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-6" /><h2 className="text-emerald-500 font-black uppercase tracking-[0.3em] text-xs">Synchronizing Neural Profile...</h2><p className="text-slate-500 text-[10px] mt-4 uppercase tracking-widest max-w-[200px]">Establishing secure connection to biological data matrix</p></div>;
  if (user && !user.onboarded) return <Onboarding onComplete={handleOnboardingComplete} />;
  if (!user) return <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center"><button onClick={() => window.location.reload()} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest">Retry Connection</button></div>;

  return (
    <div className="min-h-screen pb-32 max-w-md mx-auto relative bg-slate-50 overflow-hidden flex flex-col shadow-2xl">
      <header className="p-6 flex justify-between items-center bg-white border-b border-slate-100 z-30">
        <div className="flex flex-col"><h1 className="text-2xl font-black text-emerald-600 tracking-tight italic">NutriSnap</h1><p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.2em]">{user.is_pro ? 'PRO MEMBER' : 'FREE PLAN'}</p></div>
        <div className="flex items-center gap-2">
          {!user.is_pro && <button onClick={() => setShowPaywall(true)} className="px-3 py-1 bg-amber-500 text-white text-[10px] font-black rounded-full shadow-lg shadow-amber-500/20">UPGRADE</button>}
          <button onClick={() => setShowSettings(true)} className="p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 relative no-scrollbar">
        {activeTab === 'dashboard' && <Dashboard user={user} waterIntake={waterIntake} currentCals={currentCals} onAddWater={handleAddWater} onFindHealthy={() => setShowRestaurants(true)} onOpenCoach={openCoach} history={scanHistory} />}
        {activeTab === 'scan' && <Scanner canScan={canUserScan} onScanStart={() => setIsScanningGlobal(true)} onScanComplete={handleScanComplete} triggerPaywall={() => setShowPaywall(true)} />}
        {activeTab === 'planner' && <MealPlanner user={user} currentCals={currentCals} triggerPaywall={() => setShowPaywall(true)} />}
        {activeTab === 'community' && <Community posts={communityPosts} currentUserId={user.id} onLike={handleLikePost} onDelete={handleDeletePost} />}
        {activeTab === 'insights' && <BioInsights user={user} triggerPaywall={() => setShowPaywall(true)} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-3xl border-t border-slate-100 grid grid-cols-5 gap-0 p-2 pb-8 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] rounded-t-[2.5rem]">
        <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} label="Home" activeColor="bg-blue-500" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>} />
        <TabButton active={activeTab === 'planner'} onClick={() => setActiveTab('planner')} label="Plan" activeColor="bg-purple-500" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>} />
        <TabButton active={activeTab === 'scan'} onClick={() => setActiveTab('scan')} label="Lens" primary activeColor="bg-emerald-500" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>} />
        <TabButton active={activeTab === 'community'} onClick={() => setActiveTab('community')} label="Feed" activeColor="bg-orange-500" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
        <TabButton active={activeTab === 'insights'} onClick={() => setActiveTab('insights')} label="Insights" activeColor="bg-rose-500" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>} />
      </nav>

      {isScanningGlobal && <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-lg flex flex-col items-center justify-center p-8 text-white text-center animate-in fade-in duration-300"><div className="relative mb-8"><div className="w-24 h-24 border-8 border-emerald-500/20 rounded-full" /><div className="absolute inset-0 border-8 border-emerald-500 border-t-transparent rounded-full animate-spin" /><div className="absolute inset-4 bg-emerald-500/10 rounded-full animate-pulse" /></div><h2 className="text-3xl font-black italic uppercase tracking-tighter mb-4 text-emerald-400">Metabolic Scan</h2><p className="text-slate-200 text-sm max-w-xs leading-relaxed font-medium">Gemini AI is calculating nutrient density and energy markers...</p></div>}

      {showResultModal && lastScanResult && (
        <div className="fixed inset-0 z-[110] bg-white flex flex-col animate-in slide-in-from-bottom duration-500 overflow-y-auto no-scrollbar">
          <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 p-6 flex justify-between items-center z-20">
             <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">AI Biological Report</span><h2 className="text-xl font-black text-slate-800 italic uppercase">Synthesis Complete</h2></div>
             <button onClick={() => setShowResultModal(false)} className="text-slate-400 p-2 bg-slate-50 rounded-full hover:bg-slate-100"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
          <div className="p-6 space-y-10 pb-40">
             {lastScanResult.scanned_image && <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white"><img src={lastScanResult.scanned_image} className="w-full object-cover aspect-video" alt="Scan" /><div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-md px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl border border-white/40"><div className="flex flex-col"><span className="text-[8px] font-black uppercase text-slate-400 leading-none mb-1">Health Score</span><span className={`text-2xl font-black italic leading-none ${lastScanResult.health_score > 70 ? 'text-emerald-500' : 'text-amber-500'}`}>{lastScanResult.health_score}</span></div></div></div>}
             
             <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-2 px-2">
                {lastScanResult.key_nutrients.map((n, i) => (
                  <span key={i} className="flex-none bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">{n}</span>
                ))}
             </div>

             <div className="grid grid-cols-2 gap-6">
                <div className={`p-8 rounded-[2rem] flex flex-col items-center justify-center text-center space-y-2 relative overflow-hidden ${lastScanResult.health_score > 70 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                   <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Verdict</span>
                   <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-none">{lastScanResult.verdict}</h3>
                </div>
                <div className="bg-slate-900 p-8 rounded-[2rem] flex flex-col items-center justify-center text-center space-y-2 border border-white/5">
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">NOVA Score</span>
                   <div className="flex items-end gap-1">
                      <span className={`text-4xl font-black italic leading-none ${lastScanResult.nova_score < 3 ? 'text-emerald-400' : 'text-amber-400'}`}>{lastScanResult.nova_score}</span>
                      <span className="text-[10px] font-black text-slate-600 uppercase mb-1">/ 4</span>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-4 gap-2 text-center">
                <StatCard label="kcal" val={lastScanResult.calories} color="bg-slate-50 text-slate-800" />
                <StatCard label="prot" val={lastScanResult.protein} suffix="g" color="bg-blue-50 text-blue-600" />
                <StatCard label="carb" val={lastScanResult.carbs} suffix="g" color="bg-amber-50 text-amber-600" />
                <StatCard label="fat" val={lastScanResult.fat} suffix="g" color="bg-rose-50 text-rose-600" />
             </div>

             <div className="space-y-6">
                <div>
                   <h4 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] px-2 mb-3">Metabolic Impact</h4>
                   <p className="text-sm font-medium text-slate-700 italic leading-relaxed px-2">"{lastScanResult.motivation}"</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100/50">
                    <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">Neural Benefits</h5>
                    <ul className="space-y-2">
                       {(lastScanResult.health_benefits || []).slice(0, 3).map((b, i) => (
                         <li key={i} className="text-xs font-medium text-emerald-800 flex gap-2">
                           <span className="text-emerald-400">•</span> {b}
                         </li>
                       ))}
                    </ul>
                  </div>
                  {(lastScanResult.harmful_warnings || []).length > 0 && (
                    <div className="bg-rose-50/50 p-6 rounded-[2rem] border border-rose-100/50">
                      <h5 className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-3">System Warnings</h5>
                      <ul className="space-y-2">
                         {(lastScanResult.harmful_warnings || []).slice(0, 3).map((w, i) => (
                           <li key={i} className="text-xs font-medium text-rose-800 flex gap-2">
                             <span className="text-rose-400">•</span> {w}
                           </li>
                         ))}
                      </ul>
                    </div>
                  )}
                </div>
             </div>

             {lastScanResult.better_alternatives && lastScanResult.better_alternatives.length > 0 && (
               <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] px-2">Elite Substitutions</h4>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                     {lastScanResult.better_alternatives.map((alt, i) => (
                       <div key={i} className="flex-none bg-white border border-slate-100 p-5 rounded-3xl shadow-sm flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          </div>
                          <span className="text-xs font-black italic text-slate-700">{alt}</span>
                       </div>
                     ))}
                  </div>
               </div>
             )}

             <div className="space-y-4 pt-6">
                <button onClick={logAndShareMeal} className="w-full bg-gradient-to-r from-emerald-600 to-indigo-600 text-white py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-[0_25px_50px_-12px_rgba(16,185,129,0.5)] active:scale-[0.98] transition-all flex flex-col items-center justify-center leading-none"><span>Log & Post to Collective</span><span className="text-[8px] opacity-60 mt-1 uppercase tracking-widest">Global Sync Active</span></button>
                <div className="grid grid-cols-2 gap-4">
                   <button onClick={logMeal} className="bg-white border border-slate-200 text-slate-600 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-sm">Local Log Only</button>
                   <button onClick={shareToCommunity} className="bg-white border border-slate-200 text-indigo-600 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-sm">Global Share</button>
                </div>
             </div>
          </div>
        </div>
      )}

      {showPaywall && <Paywall isLoading={sub.isLoading} onBuyMonthly={() => { sub.buyMonthly(); setShowPaywall(false); }} onBuyYearly={() => { sub.buyYearly(); setShowPaywall(false); }} onRestore={sub.restorePurchases} onClose={() => setShowPaywall(false)} />}
      {showCoach && <Coach onLogWater={handleAddWater} onClose={() => setShowCoach(false)} />}
      {showRestaurants && <NearbyRestaurants restaurants={nearbyResults} onClose={() => setShowRestaurants(false)} />}
      {showSettings && <Settings user={user} onUpdate={handleUpdateProfile} onReset={handleResetProfile} onClose={() => setShowSettings(false)} />}
    </div>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; label: string; icon: React.ReactNode; primary?: boolean; activeColor?: string }> = ({ active, onClick, label, icon, primary, activeColor = 'bg-emerald-500' }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center gap-1 transition-all flex-1 h-14 ${primary ? '-mt-10 mb-2' : ''}`}>
    <div className={`p-2.5 rounded-2xl transition-all duration-300 relative ${primary ? 'bg-gradient-to-br from-emerald-400 to-indigo-600 text-white shadow-[0_15px_30px_-5px_rgba(16,185,129,0.4)] scale-[1.35] z-10' : active ? `${activeColor} bg-opacity-10 text-slate-900` : 'text-slate-300'}`}>{icon}{active && !primary && <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${activeColor.replace('bg-', 'text-').replace('-500', '') === activeColor ? 'bg-slate-900' : activeColor}`} />}</div>
    <span className={`text-[8px] font-black uppercase tracking-widest transition-colors duration-300 ${active ? 'text-slate-900' : 'text-slate-300'}`}>{label}</span>
  </button>
);

const StatCard: React.FC<{ label: string; val: number; suffix?: string; color: string }> = ({ label, val, suffix = '', color }) => (
  <div className={`${color} rounded-2xl p-2 border border-white/40 shadow-sm`}><span className="block text-[7px] uppercase font-black opacity-60 tracking-widest">{label}</span><span className="text-sm font-black italic">{val}{suffix}</span></div>
);

export default App;
