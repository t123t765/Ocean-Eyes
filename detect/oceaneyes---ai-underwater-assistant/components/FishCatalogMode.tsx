import React, { useState } from 'react';
import { ChevronLeft, ChevronDown, ChevronUp, ShieldAlert, BookOpen } from 'lucide-react';
import { MARINE_FISH_KNOWLEDGE, FishKnowledgeEntry } from '../services/marineDataService';

interface Props {
  onBack: () => void;
  t: any;
  language: 'zh' | 'en';
}

const FISH_LIST = MARINE_FISH_KNOWLEDGE.sort((a, b) => a.id.localeCompare(b.id));

const FishCard: React.FC<{
  fish: FishKnowledgeEntry;
  language: 'zh' | 'en';
  t: any;
  expanded: boolean;
  onToggle: () => void;
}> = ({ fish, language, t, expanded, onToggle }) => {
  const name = language === 'zh' ? fish.nameZh : fish.nameEn;
  const desc = language === 'zh' ? fish.descriptionZh : fish.descriptionEn;
  const tip = language === 'zh' ? fish.toxicityDescription : fish.toxicityDescription;
  const imageUrl = fish.image_path;

  return (
    <div
      className={`glass-panel rounded-[2rem] overflow-hidden border border-white/5 transition-all ${
        fish.isToxic ? 'border-l-4 border-l-red-500/80' : 'border-l-4 border-l-cyan-500/50'
      }`}
    >
      <button onClick={onToggle} className="w-full text-left">
        <div className="relative h-36 overflow-hidden">
          <img src={imageUrl} className="w-full h-full object-cover" alt={name} />
          {fish.isToxic && (
            <div className="absolute top-3 right-3 bg-red-500/90 text-white px-2 py-1 rounded-xl flex items-center gap-1">
              <ShieldAlert size={12} />
              <span className="text-[8px] font-black uppercase">{t.poisonous || 'TOXIC'}</span>
            </div>
          )}
        </div>
        <div className="p-4 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-white">{name}</h4>
            <p className="text-[10px] text-slate-500 font-mono">{fish.scientificName}</p>
          </div>
          {expanded ? <ChevronUp size={20} className="text-slate-500 shrink-0" /> : <ChevronDown size={20} className="text-slate-500 shrink-0" />}
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-white/5">
          <p className="text-sm text-slate-300 leading-relaxed mb-3">{desc}</p>
          <div className="flex items-start gap-2 text-cyan-400/90 text-xs">
            <span className="shrink-0 font-bold uppercase">{t.fish_safe_tip || 'Tip'}:</span>
            <span className="text-slate-400">{language === 'zh' ? fish.toxicityDescription : fish.toxicityDescriptionEn}</span>
          </div>
        </div>
      )}
    </div>
  );
};

const FishCatalogMode: React.FC<Props> = ({ onBack, t, language }) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div className="h-full flex flex-col bg-slate-950">
      <header className="flex items-center gap-4 p-4 sm:p-6 border-b border-white/5 shrink-0">
        <button onClick={onBack} className="p-3 glass-panel rounded-2xl text-slate-400 hover:text-white transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div className="flex items-center gap-3">
          <div className="bg-cyan-500/20 p-2 rounded-2xl">
            <BookOpen size={24} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-tighter">
              {t.fish_directory || (language === 'zh' ? '分布生物科普' : 'Marine Life Catalog')}
            </h1>
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 pb-24" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="space-y-4">
          {FISH_LIST.map((fish) => (
            <FishCard
              key={fish.id}
              fish={fish}
              language={language}
              t={t}
              expanded={expandedId === fish.id}
              onToggle={() => setExpandedId(expandedId === fish.id ? null : fish.id)}
            />
          ))}
        </div>
        <p className="text-[10px] text-slate-500 mt-4 text-center">
          {language === 'zh' ? `共收录 ${MARINE_FISH_KNOWLEDGE.length} 种海洋生物` : `Total ${MARINE_FISH_KNOWLEDGE.length} species catalogued`}
        </p>
      </div>
    </div>
  );
};

export default FishCatalogMode;
