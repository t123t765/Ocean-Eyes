
import React, { useState } from 'react';
import { MapPin, Search, Fish, ShieldAlert, ChevronRight, BookOpen } from 'lucide-react';
import { SEA_AREAS } from '../constants';
import { MARINE_FISH_KNOWLEDGE } from '../services/marineDataService';

// 根据海域获取不同的鱼类
const getFishByArea = (areaId: string) => {
  switch (areaId) {
    case 'scs':
      return MARINE_FISH_KNOWLEDGE.slice(0, 6); // 南海显示前6个
    case 'sanya':
      return MARINE_FISH_KNOWLEDGE.slice(6, 12); // 三亚显示中间6个
    case 'philippines':
      return MARINE_FISH_KNOWLEDGE.slice(12, 18); // 菲律宾显示后面6个
    default:
      return MARINE_FISH_KNOWLEDGE.slice(0, 6);
  }
};

interface Props {
  t: any;
  language: 'zh' | 'en';
  onOpenFishCatalog: () => void;
}

const GeneralMode: React.FC<Props> = ({ t, language, onOpenFishCatalog }) => {
  const [selectedArea, setSelectedArea] = useState(SEA_AREAS[0]);

  return (
    <div className="p-4 sm:p-6 pb-24 overflow-y-auto h-full no-scrollbar">
      {/* Search Header */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input 
          type="text" 
          placeholder={t.search_placeholder}
          className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-cyan-500 outline-none text-sm text-white"
        />
      </div>

      {/* Selected Sea Area Card */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black flex items-center gap-2 tracking-tighter uppercase text-white">
            <MapPin className="text-cyan-400" size={20} />
            {t.current_location}
          </h2>
          <span className="text-[9px] font-black text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded tracking-widest">{t.gps_on}</span>
        </div>
        
        <div className="relative h-48 rounded-[2.5rem] overflow-hidden group border border-white/5">
          <img src={selectedArea.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={language === 'zh' ? selectedArea.nameZh : selectedArea.nameEn} />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
          <div className="absolute bottom-6 left-6">
            <h3 className="text-2xl font-black text-white">{language === 'zh' ? selectedArea.nameZh : selectedArea.nameEn}</h3>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
               {selectedArea.fishCount} Species Catalogued
            </p>
          </div>
          <button 
            onClick={() => {
              const currentIndex = SEA_AREAS.findIndex(area => area.id === selectedArea.id);
              const prevIndex = (currentIndex - 1 + SEA_AREAS.length) % SEA_AREAS.length;
              setSelectedArea(SEA_AREAS[prevIndex]);
            }}
            className="absolute top-1/2 left-4 transform -translate-y-1/2 p-2 bg-white/10 hover:bg-cyan-500/20 backdrop-blur-md rounded-xl border border-white/10 transition-all"
          >
            <ChevronRight size={20} className="text-white rotate-180" />
          </button>
          <button 
            onClick={() => {
              const currentIndex = SEA_AREAS.findIndex(area => area.id === selectedArea.id);
              const nextIndex = (currentIndex + 1) % SEA_AREAS.length;
              setSelectedArea(SEA_AREAS[nextIndex]);
            }}
            className="absolute top-1/2 right-4 transform -translate-y-1/2 p-2 bg-white/10 hover:bg-cyan-500/20 backdrop-blur-md rounded-xl border border-white/10 transition-all"
          >
            <ChevronRight size={20} className="text-white" />
          </button>
        </div>
      </section>

      {/* Fish Directory - 基于本地知识库，覆盖 YOLO 26 类 */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black flex items-center gap-3 tracking-tighter uppercase text-white">
            <div className="w-1.5 h-6 bg-cyan-500 rounded-full" />
            {t.fish_directory}
          </h2>
          <button
            onClick={onOpenFishCatalog}
            className="text-cyan-400 text-xs font-bold uppercase tracking-widest hover:text-cyan-300 transition-colors flex items-center gap-1"
          >
            {t.view_all}
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {getFishByArea(selectedArea.id).map(fish => (
            <button
              key={fish.id}
              onClick={onOpenFishCatalog}
              className="glass-panel rounded-[2rem] overflow-hidden flex flex-col group border border-white/5 text-left transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="relative h-32 overflow-hidden">
                <img
                  src={fish.image_path}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  alt={language === 'zh' ? fish.nameZh : fish.nameEn}
                />
                {fish.isToxic && (
                  <div className="absolute top-3 right-3 bg-red-500/90 text-white p-1.5 rounded-xl shadow-lg flex items-center gap-1">
                    <ShieldAlert size={12} />
                    <span className="text-[8px] font-black uppercase tracking-tighter">{t.poisonous}</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h4 className="font-bold text-sm mb-1 text-white">{language === 'zh' ? fish.nameZh : fish.nameEn}</h4>
                <p className="text-[10px] text-slate-500 italic mb-2 font-mono tracking-tighter">{fish.scientificName}</p>
                <div className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                  {language === 'zh' ? fish.descriptionZh : fish.descriptionEn}
                </div>
              </div>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-slate-500 mt-3 text-center">
          {language === 'zh' ? `点击卡片或「查看全部」浏览完整 ${MARINE_FISH_KNOWLEDGE.length} 种鱼类科普` : `Tap cards or View All for ${MARINE_FISH_KNOWLEDGE.length} species`}
        </p>
      </section>
    </div>
  );
};

export default GeneralMode;
