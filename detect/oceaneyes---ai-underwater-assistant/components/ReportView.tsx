
import React from 'react';
import { Calendar, Clock, MapPin, Download, Share2, Fish, Award, ChevronLeft, ShieldAlert, Sparkles, BookOpen } from 'lucide-react';
import { DiveSession, Detection } from '../types';
import { FISH_ENCYCLOPEDIA } from '../fishEncyclopedia';
import { MARINE_FISH_KNOWLEDGE, getFishKnowledgeByYoloClassId } from '../services/marineDataService';
import { generateLocalDiveReport } from '../services/localReportService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  detections: Detection[];
  onBack: () => void;
  onShare?: () => void;
  t: any;
  language: 'zh' | 'en';
}

const ReportView: React.FC<Props> = ({ detections, onBack, onShare, t, language }) => {
  const report = generateLocalDiveReport(detections, "蜈支洲岛 (Wuzhizhou)", language);

  const counts = detections.reduce((acc: Record<string, number>, d) => {
    const fish = getFishKnowledgeByYoloClassId(d.fishId as number);
    const fishName = fish ? (language === 'zh' ? fish.nameZh : fish.nameEn) : `Class ${d.fishId}`;
    acc[fishName] = (acc[fishName] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(counts).map(([name, count]) => ({ name, count }));
  const dangerousEncounters = detections.filter(d => d.isToxic).length;

  const uniqueFishIds = [...new Set(detections.map(d => d.fishId))];
  const fish科普List = uniqueFishIds
    .map(id => {
      const fish = getFishKnowledgeByYoloClassId(id as number);
      if (!fish) return null;
      const count = counts[language === 'zh' ? fish.nameZh : fish.nameEn] || 0;
      return { ...fish, count };
    })
    .filter(Boolean) as Array<{ id: string; nameZh: string; nameEn: string; scientificName: string; descriptionZh: string; descriptionEn: string; isToxic: boolean; toxicityDescription: string; image_path: string; detailsZh: string[]; detailsEn: string[]; count: number }>;

  return (
    <div className="h-full bg-slate-950 overflow-y-auto overflow-x-hidden overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="p-4 sm:p-6 pb-32 min-h-full">
      <header className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="p-3 glass-panel rounded-2xl text-slate-400 hover:text-white transition-colors">
           <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-black uppercase tracking-tighter text-white">{t.report_title}</h1>
        <div className="flex gap-2">
            <button className="p-3 glass-panel rounded-2xl text-cyan-400 hover:bg-cyan-400/10 transition-colors"><Download size={20}/></button>
            <button 
              onClick={onShare}
              className="p-3 bg-cyan-600 rounded-2xl text-white shadow-lg shadow-cyan-900/20 hover:scale-105 transition-transform"
            >
              <Share2 size={20}/>
            </button>
        </div>
      </header>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="glass-panel p-5 rounded-[2rem] border-l-4 border-cyan-500 relative overflow-hidden group">
            <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">
                 {t.dive_time}
            </div>
            <div className="text-3xl font-black text-white">42<span className="text-sm font-normal text-slate-500 ml-1">M</span></div>
        </div>
        <div className="glass-panel p-5 rounded-[2rem] border-l-4 border-emerald-500 relative overflow-hidden group">
            <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">
                 {t.species_count}
            </div>
            <div className="text-3xl font-black text-white">{Object.keys(counts).length}<span className="text-sm font-normal text-slate-500 ml-1">TYPES</span></div>
        </div>
      </div>

      {/* Safety Summary */}
      {dangerousEncounters > 0 && (
          <div className="mb-8 glass-panel p-5 rounded-[2rem] bg-red-950/10 border-red-500/20 border-2 flex items-center gap-4">
              <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shrink-0">
                  <ShieldAlert size={24} />
              </div>
              <div className="flex-1">
                  <div className="text-xs font-black text-red-500 uppercase tracking-widest mb-0.5">{t.safety_alert_title}</div>
                  <div className="text-sm text-slate-300">{t.safety_alert_desc.replace('{count}', dangerousEncounters.toString())}</div>
              </div>
          </div>
      )}

      {/* AI Summary */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-cyan-400 to-blue-600 p-2.5 rounded-2xl shadow-lg shadow-cyan-900/40">
                <Sparkles size={24} className="text-white" />
            </div>
            <div>
                <h2 className="text-xl font-black text-white tracking-tighter uppercase">{t.ai_summary_title}</h2>
                <div className="text-[10px] text-cyan-500 font-bold uppercase tracking-widest">{language === 'zh' ? '基于本地鱼类知识库生成' : 'Generated from Local Fish Encyclopedia'}</div>
            </div>
        </div>
        <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative text-slate-300 text-sm prose prose-invert max-w-none">
          <div className="space-y-4" dangerouslySetInnerHTML={{ __html: report
            .replace(/^## (.*)$/gm, '<strong class="text-cyan-400 block mt-4 mb-2">$1</strong>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em class="text-slate-400">$1</em>')
            .replace(/\n/g, '<br/>')
          }} />
        </div>
      </section>

      {/* Species Chart */}
      <section className="mb-10">
        <h2 className="text-lg font-black mb-6 flex items-center gap-3 text-white uppercase tracking-tighter">
            <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
            {t.species_frequency || (language === 'zh' ? '发现种类频次' : 'Species Encounter Frequency')}
        </h2>
        <div className="glass-panel p-6 rounded-[2.5rem] h-72 border border-white/5">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={chartData} layout="vertical">
               <XAxis type="number" hide />
               <YAxis dataKey="name" type="category" width={90} tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
               <Tooltip 
                 cursor={{fill: 'rgba(255,255,255,0.02)'}} 
                 contentStyle={{background: '#0f172a', borderRadius: '1rem', border: '1px solid #334155'}}
               />
               <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={20}>
                 {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#0891b2' : '#10b981'} />
                 ))}
               </Bar>
             </BarChart>
           </ResponsiveContainer>
        </div>
      </section>

      {/* 鱼类科普 - 根据检测结果展示每种鱼的科普知识 */}
      {fish科普List.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-black mb-6 flex items-center gap-3 text-white uppercase tracking-tighter">
            <div className="w-1.5 h-6 bg-cyan-500 rounded-full" />
            <BookOpen size={20} className="text-cyan-400" />
            {t.fish_guide_title || (language === 'zh' ? '鱼类科普' : 'Fish Species Guide')}
          </h2>
          <div className="space-y-4">
            {fish科普List.map((fish) => (
              <div
                key={fish.id}
                className={`glass-panel p-6 rounded-[2rem] border-l-4 ${
                  fish.isToxic ? 'border-red-500/80 bg-red-950/10' : 'border-cyan-500/50'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-white">
                    {language === 'zh' ? fish.nameZh : fish.nameEn}
                  </h3>
                  <div className="flex items-center gap-2">
                    {fish.isToxic && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 uppercase">
                        {t.fish_toxic_tag || (language === 'zh' ? '有毒/需注意' : 'Toxic')}
                      </span>
                    )}
                    <span className="text-slate-500 text-sm">
                      {language === 'zh' ? `发现 ${fish.count} 次` : `×${fish.count}`}
                    </span>
                  </div>
                </div>
                <p className="text-slate-400 text-xs mb-2 font-mono">{fish.scientificName}</p>
                <p className="text-slate-300 text-sm leading-relaxed mb-3">
                  {language === 'zh' ? fish.descriptionZh : fish.descriptionEn}
                </p>
                <div className="flex items-start gap-2 text-cyan-400/90 text-xs">
                  <span className="shrink-0 font-bold uppercase">
                    {(t.fish_safe_tip || (language === 'zh' ? '观察建议' : 'Tip'))}:{' '}
                  </span>
                  <span className="text-slate-400">
                    {language === 'zh' ? fish.behaviorTipZh : fish.behaviorTipEn}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      </div>
    </div>
  );
};

export default ReportView;
