
import React, { useState } from 'react';
import { ChevronLeft, Globe, Camera, Glasses, Bluetooth, CheckCircle2, RefreshCw, ChevronRight } from 'lucide-react';

interface Props {
  onBack: () => void;
  language: 'zh' | 'en';
  setLanguage: (lang: 'zh' | 'en') => void;
  t: any;
}

const SettingsMode: React.FC<Props> = ({ onBack, language, setLanguage, t }) => {
  const [cameraStatus, setCameraStatus] = useState<'connected' | 'disconnected'>('connected');
  const [glassesStatus, setGlassesStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setGlassesStatus('connected');
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 p-6 overflow-y-auto no-scrollbar">
      <header className="flex items-center gap-4 mb-10">
        <button onClick={onBack} className="p-3 glass-panel rounded-2xl text-slate-400 hover:text-white transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-black text-white tracking-tighter uppercase">{t.settings_title}</h1>
      </header>

      {/* Language Section */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="text-cyan-400" size={18} />
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t.lang_settings}</h2>
        </div>
        <div className="glass-panel p-2 rounded-2xl flex gap-1 border border-white/5">
          <button 
            onClick={() => setLanguage('zh')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${language === 'zh' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/40' : 'text-slate-500 hover:text-slate-300'}`}
          >
            简体中文
          </button>
          <button 
            onClick={() => setLanguage('en')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${language === 'en' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/40' : 'text-slate-500 hover:text-slate-300'}`}
          >
            English
          </button>
        </div>
      </section>

      {/* Device Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bluetooth className="text-cyan-400" size={18} />
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t.device_mgmt}</h2>
          </div>
          <button 
            onClick={handleScan}
            disabled={isScanning}
            className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1 hover:text-cyan-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={isScanning ? 'animate-spin' : ''} />
            {isScanning ? t.scanning : t.rescan}
          </button>
        </div>

        <div className="space-y-4">
          {/* Action Camera */}
          <div className="glass-panel p-5 rounded-[2rem] border border-white/5 flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${cameraStatus === 'connected' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                <Camera size={24} />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">{t.camera}</h3>
                <div className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${cameraStatus === 'connected' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    {cameraStatus === 'connected' ? t.connected : t.disconnected}
                  </span>
                </div>
              </div>
            </div>
            {cameraStatus === 'connected' ? (
              <CheckCircle2 size={20} className="text-emerald-500" />
            ) : (
              <button className="p-2 text-cyan-400 hover:bg-cyan-400/10 rounded-xl transition-colors">
                <ChevronRight size={20} />
              </button>
            )}
          </div>

          {/* Smart Glasses */}
          <div className="glass-panel p-5 rounded-[2rem] border border-white/5 flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${glassesStatus === 'connected' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                <Glasses size={24} />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">{t.glasses}</h3>
                <div className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${glassesStatus === 'connected' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    {glassesStatus === 'connected' ? t.connected : t.disconnected}
                  </span>
                </div>
              </div>
            </div>
            {glassesStatus === 'connected' ? (
              <CheckCircle2 size={20} className="text-emerald-500" />
            ) : (
              <button 
                onClick={handleScan}
                className="px-4 py-2 bg-cyan-600/10 text-cyan-400 text-[10px] font-bold rounded-full hover:bg-cyan-600/20 transition-all border border-cyan-400/20"
              >
                {t.pairing}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Account Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t.nav_me}</h2>
        </div>
        <div className="glass-panel rounded-[2rem] border border-white/5 divide-y divide-white/5">
          <div className="p-5 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer">
            <span className="text-sm text-slate-300">{t.model_update}</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500">v1.2.4</span>
              <ChevronRight size={16} className="text-slate-700" />
            </div>
          </div>
          <div className="p-5 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer text-red-400">
            <span className="text-sm font-bold">{t.logout}</span>
            <ChevronRight size={16} />
          </div>
        </div>
      </section>

      <div className="mt-auto pt-10 pb-20 text-center">
        <p className="text-[10px] text-slate-700 font-mono uppercase tracking-[0.4em]">OceanEyes AI v2.5.0-PRO</p>
      </div>
    </div>
  );
};

export default SettingsMode;
