
import React from 'react';
import { Post } from '../types';

interface CommunityProps {
  posts: Post[];
  currentUserId: string;
  onLike: (postId: string) => void;
  onDelete: (postId: string) => void;
}

const Community: React.FC<CommunityProps> = ({ posts, currentUserId, onLike, onDelete }) => {
  return (
    <div className="max-w-xl mx-auto space-y-10 animate-in fade-in duration-700 pb-24 px-2">
      
      {/* Community Hero */}
      <div className="relative overflow-hidden bg-indigo-600 rounded-[3rem] p-8 text-white shadow-2xl shadow-indigo-200">
        <div className="relative z-10">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200 mb-2 block">Global Network</span>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none mb-4">Biological Feed</h2>
          <p className="text-indigo-100 text-xs font-medium opacity-80 max-w-[200px]">Real-time metabolic updates from the NutriSnap collective.</p>
        </div>
        <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 p-6">
           <div className="flex -space-x-3">
              {posts.slice(0, 3).map((p, i) => (
                <img key={i} src={p.user_avatar} className="w-10 h-10 rounded-full border-4 border-indigo-600 object-cover shadow-xl" />
              ))}
              <div className="w-10 h-10 rounded-full bg-indigo-500 border-4 border-indigo-600 flex items-center justify-center text-[10px] font-black">+{Math.max(0, posts.length - 3)}</div>
           </div>
        </div>
      </div>

      {/* Feed Filter */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 no-scrollbar">
         {['Trending', 'Newest', 'Verified', 'My Goals'].map((f, i) => (
           <button key={i} className={`flex-none px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
             i === 1 ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' : 'bg-white text-slate-400 border border-slate-100'
           }`}>
             {f}
           </button>
         ))}
      </div>

      {/* Posts List */}
      <div className="space-y-12">
        {posts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No life signs detected yet...</p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden group transition-all">
              {/* Post Header */}
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img src={post.user_avatar} alt={post.user_name} className="w-12 h-12 rounded-2xl object-cover shadow-lg" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm italic uppercase tracking-tight">{post.user_name}</h4>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{post.timestamp}</span>
                  </div>
                </div>
                {post.user_id === currentUserId && (
                  <button onClick={() => onDelete(post.id)} className="p-2 text-rose-300 hover:text-rose-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Post Image with Badge */}
              <div className="relative aspect-square px-4">
                <img src={post.image_url} alt="Meal" className="w-full h-full object-cover rounded-[2.5rem] shadow-inner" />
                <div className="absolute top-8 right-8">
                   <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-2 shadow-xl border border-white/20">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest italic">AI Verified</span>
                   </div>
                </div>
              </div>

              {/* Nutrition Summary (Persistent in community) */}
              {post.nutrition_summary && (
                <div className="px-6 mt-4 flex gap-2">
                   <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 flex flex-col">
                      <span className="text-[7px] font-black uppercase text-slate-400 tracking-widest">Energy</span>
                      <span className="text-[10px] font-black text-slate-800">{post.nutrition_summary.calories}kcal</span>
                   </div>
                   <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 flex flex-col">
                      <span className="text-[7px] font-black uppercase text-slate-400 tracking-widest">Protein</span>
                      <span className="text-[10px] font-black text-emerald-600">{post.nutrition_summary.protein}g</span>
                   </div>
                   <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 flex flex-col">
                      <span className="text-[7px] font-black uppercase text-slate-400 tracking-widest">Verdict</span>
                      <span className="text-[10px] font-black text-indigo-600">{post.nutrition_summary.verdict}</span>
                   </div>
                </div>
              )}

              {/* Post Interactions */}
              <div className="p-6 pt-6">
                <div className="flex items-center gap-6 mb-6">
                  <button onClick={() => onLike(post.id)} className="flex items-center gap-2 group">
                    <div className="p-3 bg-rose-50 rounded-2xl group-hover:bg-rose-500 group-hover:text-white text-rose-500 transition-all shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={post.likes > 0 ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <span className="text-xs font-black text-slate-900">{post.likes}</span>
                  </button>
                  <button className="flex items-center gap-2 group">
                    <div className="p-3 bg-indigo-50 rounded-2xl group-hover:bg-indigo-500 group-hover:text-white text-indigo-500 transition-all shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <span className="text-xs font-black text-slate-900">Comment</span>
                  </button>
                </div>
                <div className="space-y-2">
                  <p className="text-slate-700 text-sm leading-relaxed">
                    <span className="font-black italic uppercase text-slate-900 mr-2 tracking-tight">{post.user_name}</span>
                    {post.caption}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Community;
