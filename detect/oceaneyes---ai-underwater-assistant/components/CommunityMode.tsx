
import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Search, Filter, UserPlus, MapPin, Fish, Sparkles } from 'lucide-react';
import { CommunityPost } from '../types';

// Define Props interface to match the usage in App.tsx
interface Props {
  t: any;
  language: 'zh' | 'en';
}

const MOCK_POSTS: CommunityPost[] = [
  {
    id: 'p1',
    userId: 'u1',
    userName: '潜水大拿-阿强',
    userAvatar: 'https://i.pravatar.cc/150?u=阿强',
    location: '海南西沙',
    imageUrl: 'https://picsum.photos/seed/underwater1/800/600',
    fishFound: ['狮子鱼', '珊瑚鱼'],
    caption: '今天在西沙偶遇狮子鱼，Gemini 3 实时报警救了我一命！真的很准，毒性分析很到位。',
    likes: 124,
    comments: [],
    isAiGenerated: true,
    timestamp: Date.now() - 3600000
  },
  {
    id: 'p2',
    userId: 'u2',
    userName: '人鱼小姐',
    userAvatar: 'https://i.pravatar.cc/150?u=mermaid',
    location: '菲律宾薄荷岛',
    imageUrl: 'https://picsum.photos/seed/underwater2/800/600',
    fishFound: ['海龟', '小丑鱼'],
    caption: '薄荷岛的水下世界太美了，小海龟一直跟着我游，记录下了这一刻。',
    likes: 356,
    comments: [],
    isAiGenerated: false,
    timestamp: Date.now() - 7200000
  }
];

// Fixed: Added Props interface and destructured 't' and 'language' from props
const CommunityMode: React.FC<Props> = ({ t, language }) => {
  const filters = [t.filter_all, t.filter_area, t.filter_toxic, t.filter_ai, t.filter_photo];
  const [activeFilter, setActiveFilter] = useState(t.filter_all);

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-y-auto no-scrollbar">
      {/* Community Header */}
      <div className="p-6 pb-0">
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-white">{t.community_title}</h2>
            <div className="flex gap-2">
                <button className="p-2.5 glass-panel rounded-xl text-slate-400 hover:text-cyan-400 transition-colors">
                    <Search size={20} />
                </button>
                <button className="p-2.5 glass-panel rounded-xl text-slate-400 hover:text-cyan-400 transition-colors">
                    <Filter size={20} />
                </button>
            </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
          {filters.map(f => (
            <button 
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeFilter === f ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(8,145,178,0.4)]' : 'bg-slate-900 text-slate-500 border border-slate-800'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="flex flex-col gap-6 px-4 pb-32">
        {MOCK_POSTS.map(post => (
          <div key={post.id} className="glass-panel rounded-[2.5rem] overflow-hidden border border-white/5">
            {/* User Info */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={post.userAvatar} className="w-10 h-10 rounded-full border-2 border-cyan-500/30" alt={post.userName} />
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-1">
                    {post.userName}
                    {post.isAiGenerated && <Sparkles size={12} className="text-cyan-400" />}
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <MapPin size={10} /> {post.location}
                  </div>
                </div>
              </div>
              <button className="px-4 py-1.5 bg-cyan-600/10 text-cyan-400 text-[10px] font-bold rounded-full hover:bg-cyan-600/20 transition-colors">
                <UserPlus size={12} className="inline mr-1" /> {t.follow}
              </button>
            </div>

            {/* Post Media */}
            <div className="relative aspect-square sm:aspect-video mx-2 rounded-[2rem] overflow-hidden">
                <img src={post.imageUrl} className="w-full h-full object-cover" alt="Post" />
                {post.isAiGenerated && (
                    <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
                        <Sparkles size={12} className="text-cyan-400" />
                        <span className="text-[10px] font-bold text-white">{t.filter_ai}</span>
                    </div>
                )}
            </div>

            {/* Post Stats & Actions */}
            <div className="p-5">
              <div className="flex items-center gap-6 mb-4">
                <button className="flex items-center gap-2 text-slate-400 hover:text-red-500 transition-colors group">
                    <Heart size={22} className="group-hover:fill-red-500" />
                    <span className="text-xs font-bold">{post.likes}</span>
                </button>
                <button className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors">
                    <MessageCircle size={22} />
                    <span className="text-xs font-bold">{post.comments.length}</span>
                </button>
                <button className="flex items-center gap-2 text-slate-400 ml-auto">
                    <Share2 size={20} />
                </button>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                {post.fishFound.map(fish => (
                    <span key={fish} className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-[10px] text-slate-400 flex items-center gap-1">
                        <Fish size={10} /> {fish}
                    </span>
                ))}
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                <span className="font-bold text-white mr-2">{post.userName}</span>
                {post.caption}
              </p>
              
              <div className="mt-3 text-[10px] text-slate-600 uppercase font-bold tracking-widest">
                {new Date(post.timestamp).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunityMode;
