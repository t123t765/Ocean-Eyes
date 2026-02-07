
import React from 'react';
import { AIAdvice } from '../types';
import { ShieldAlert, Info, ArrowUpRight, Compass, Thermometer, Waves, Zap, Navigation } from 'lucide-react';

interface Props {
  advice: AIAdvice | null;
  depth: number;
  oxygen: number;
  diveTime: number; // in seconds
}

const SmartGlassesHUD: React.FC<Props> = ({ advice, depth, oxygen, diveTime }) => {
  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 overflow-hidden font-mono">
      {/* Target Reticle for Danger Zone */}
      {advice?.isDangerous && (
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[40vh] h-[40vh] border-[4px] border-red-500/30 rounded-full animate-ping" />
            <div className="absolute w-[45vh] h-[45vh] border-2 border-dashed border-red-500/50 rounded-full animate-spin-slow" />
            <div className="absolute top-1/2 -translate-y-1/2 right-1/4 flex flex-col items-center">
                <div className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded mb-2">DANGER RADIUS</div>
                <div className="h-0.5 w-24 bg-gradient-to-r from-red-500 to-transparent" />
            </div>
        </div>
      )}

      {/* Top HUD - Mission Critical Data */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
            <div className="glass-panel px-4 py-2 rounded-lg flex items-center gap-4 text-xs font-bold border-l-4 border-cyan-400">
              <div className="flex items-center gap-1.5 text-cyan-400">
                <Waves size={16} />
                <span>DEPTH: {depth.toFixed(1)}M</span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-1.5 text-white">
                <ClockIcon size={16} />
                <span>TIME: {formatTime(diveTime)}</span>
              </div>
            </div>
            <div className="flex gap-2">
                <div className="glass-panel px-3 py-1 rounded-md text-[10px] text-slate-400">FPS: 60.2</div>
                <div className="glass-panel px-3 py-1 rounded-md text-[10px] text-slate-400">LATENCY: 14MS</div>
            </div>
        </div>
        
        <div className="flex flex-col items-end gap-3">
            <div className="glass-panel p-3 rounded-xl border-r-4 border-emerald-400 flex flex-col items-end">
                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                    <span className="text-[10px] font-bold uppercase">Oxygen Supply</span>
                    <Zap size={14} fill="currentColor" />
                </div>
                <div className="text-xl font-bold text-white leading-none">{oxygen}%</div>
                <div className="w-24 h-1 bg-white/10 mt-2 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 transition-all duration-1000" style={{ width: `${oxygen}%` }} />
                </div>
            </div>
            <div className="text-[10px] text-cyan-500/50 uppercase tracking-widest font-black flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                Live Broadcast Active
            </div>
        </div>
      </div>

      {/* Center - AR Interaction Zone */}
      <div className="flex-1 flex items-center justify-center relative">
        {advice && (
          <div className={`max-w-md transition-all duration-500 transform scale-110 ${advice.isDangerous ? 'translate-y-[-50px]' : ''}`}>
            <div className={`glass-panel p-5 rounded-3xl border-2 shadow-2xl ${advice.isDangerous ? 'border-red-500 danger-alert bg-red-950/20' : 'border-cyan-500 bg-cyan-950/10'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${advice.isDangerous ? 'bg-red-500' : 'bg-cyan-500'}`}>
                    {advice.isDangerous ? <ShieldAlert className="text-white" size={24} /> : <Info className="text-white" size={24} />}
                  </div>
                  <div>
                    <h3 className={`font-black text-xl uppercase tracking-tighter ${advice.isDangerous ? 'text-red-500' : 'text-cyan-400'}`}>
                      {advice.species}
                    </h3>
                    <div className="text-[10px] opacity-60 uppercase font-bold">Bio-Identification Success</div>
                  </div>
                </div>
                {advice.isDangerous && (
                    <div className="text-red-500 font-black text-xs px-2 py-1 border border-red-500 rounded">TOXICITY LV.MAX</div>
                )}
              </div>
              
              <p className="text-sm leading-relaxed mb-4 text-white font-medium bg-black/20 p-3 rounded-xl">
                {advice.warningText || advice.educationalFact}
              </p>

              {advice.isDangerous && advice.escapeDirection && (
                <div className="relative group overflow-hidden bg-red-600 py-3 rounded-2xl flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(220,38,38,0.4)]">
                   <div className="absolute inset-0 bg-white/10 translate-x-[-100%] animate-shimmer" />
                   <ArrowUpRight className="text-white animate-bounce" size={28} />
                   <span className="text-sm font-black text-white uppercase tracking-widest italic">
                     IMMEDIATE ESCAPE: {advice.escapeDirection}
                   </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom HUD - Navigation & Environment */}
      <div className="flex justify-between items-end">
        <div className="glass-panel p-4 rounded-2xl flex flex-col items-center gap-2">
            <div className="relative w-12 h-12 flex items-center justify-center border-2 border-white/20 rounded-full">
                <Navigation className="text-cyan-400 rotate-45" size={20} />
                <div className="absolute -top-1 font-bold text-[8px] text-white">N</div>
            </div>
            <span className="text-[10px] text-slate-400">142° SE</span>
        </div>

        <div className="flex-1 px-12 pb-2">
            <div className="flex justify-between text-[10px] text-cyan-400/50 mb-1 font-bold">
                <span>HORIZONTAL STABILIZER</span>
                <span>SYSTEM NOMINAL</span>
            </div>
            <div className="w-full h-1 bg-white/5 rounded-full relative">
                <div className="absolute inset-y-0 left-1/2 w-0.5 bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
                <div className="absolute inset-y-0 left-[20%] w-0.5 bg-white/20" />
                <div className="absolute inset-y-0 left-[80%] w-0.5 bg-white/20" />
            </div>
        </div>

        <div className="glass-panel px-4 py-3 rounded-2xl flex items-center gap-4">
           <div className="text-right">
              <div className="text-[10px] text-slate-400">WATER TEMP</div>
              <div className="text-lg font-bold text-cyan-400 leading-none">26.4°C</div>
           </div>
           <div className="w-px h-8 bg-white/10" />
           <Thermometer className="text-cyan-400" size={20} />
        </div>
      </div>
    </div>
  );
};

const ClockIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);

export default SmartGlassesHUD;
