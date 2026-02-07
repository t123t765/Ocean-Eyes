// src/components/DivingMode/index.tsx
import React, { useRef, useEffect } from 'react';
import { Detection } from '../types';
import { Camera, Video, Play, Pause, Upload, X, LogOut, Loader2, Radio } from 'lucide-react';

interface DivingModeProps {
  onEndDive: (detections: Detection[]) => void;
  t: Record<string, string>;
  language: 'zh' | 'en';
  videoSource: 'camera' | 'file';
  setVideoSource: (source: 'camera' | 'file') => void;
  selectedFile: File | null;
  handleVideoFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  cameraActive: boolean;
  recording: boolean;
  recordedBlob: Blob | null;
  loading: boolean;
  resultVideoUrl: string | null;
  resultVideoLocalPath: string | null;
  resultVideoWidth: number | null;
  resultVideoHeight: number | null;
  detectError: string | null;
  initCamera: () => Promise<void>;
  toggleRecording: () => void;
  uploadForDetect: () => Promise<void>;
  videoRef: React.RefObject<HTMLVideoElement>;
  lastDiveDetections: Detection[];
  realtimeDetecting: boolean;
  onStartRealtimeDetect: () => void;
  onStopRealtimeDetect: () => void;
  onRealtimeDetections: (detections: Array<{ class_id: number; count: number; is_toxic: boolean }>) => void;
  apiImageUrl: string;
}

const REALTIME_INTERVAL_MS = 2000;

const DivingMode: React.FC<DivingModeProps> = ({
  onEndDive,
  t,
  videoSource,
  setVideoSource,
  selectedFile,
  handleVideoFileChange,
  cameraActive,
  recording,
  recordedBlob,
  loading,
  resultVideoUrl,
  resultVideoLocalPath,
  resultVideoWidth,
  resultVideoHeight,
  detectError,
  initCamera,
  toggleRecording,
  uploadForDetect,
  videoRef,
  lastDiveDetections,
  realtimeDetecting,
  onStartRealtimeDetect,
  onStopRealtimeDetect,
  onRealtimeDetections,
  apiImageUrl,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const realtimeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleEndExplore = () => {
    onEndDive(lastDiveDetections);
  };

  // 从摄像头当前帧截图为 blob，调用后端图片检测并合并结果
  const captureAndDetect = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    return new Promise<void>((resolve) => {
      canvas.toBlob(
        async (blob) => {
          if (!blob) return resolve();
          try {
            const form = new FormData();
            form.append('image_file', blob, 'frame.jpg');
            const res = await fetch(apiImageUrl, { method: 'POST', body: form });
            const data = await res.json();
            if (data.code === 1 && data.result?.detections?.length) {
              onRealtimeDetections(data.result.detections);
            }
          } catch (e) {
            console.error('[实时检测]', e);
          }
          resolve();
        },
        'image/jpeg',
        0.85
      );
    });
  };

  useEffect(() => {
    if (!realtimeDetecting || !cameraActive) {
      if (realtimeIntervalRef.current) {
        clearInterval(realtimeIntervalRef.current);
        realtimeIntervalRef.current = null;
      }
      return;
    }
    realtimeIntervalRef.current = setInterval(() => {
      captureAndDetect();
    }, REALTIME_INTERVAL_MS);
    return () => {
      if (realtimeIntervalRef.current) clearInterval(realtimeIntervalRef.current);
    };
  }, [realtimeDetecting, cameraActive]);

  return (
    <div className="h-full w-full flex flex-col items-center justify-between p-4 sm:p-6 bg-slate-950 relative">
      {/* 背景装饰：贴合你原有项目的风格 */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />

      {/* 顶部标题：水下探索/开始探索 */}
      <div className="w-full text-center z-10 mt-2">
        <h2 className="text-2xl font-black text-white">{t.dive_title || '水下探索模式'}</h2>
        <p className="text-xs text-slate-400 mt-1">
          {t.dive_subtitle || '红框=有毒鱼 · 白框=无毒鱼 | 点击识别后查看结果'}
        </p>
      </div>

      {/* 核心识别交互区域：占满中间空间 */}
      <div className="flex-1 w-full flex flex-col items-center justify-center gap-4 z-10 w-full">
        {/* 错误提示：贴合你原有项目的提示风格 */}
        {detectError && (
          <div className="w-full p-3 bg-red-900/30 border border-red-500/50 rounded-2xl flex items-center gap-2 text-red-400 text-sm">
            <X size={16} />
            <span>{detectError}</span>
          </div>
        )}

        {/* 视频源选择：摄像头/本地视频（贴合移动端交互） */}
        <div className="w-full flex gap-3 justify-center">
          <button
            onClick={() => setVideoSource('camera')}
            className={`flex items-center gap-2 px-5 py-2 rounded-2xl text-sm font-bold transition-all ${
              videoSource === 'camera'
                ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-400'
                : 'bg-slate-800/50 text-slate-400 hover:text-slate-300'
            }`}
          >
            <Camera size={16} />
            {t.camera || '摄像头'}
          </button>
          <button
            onClick={() => setVideoSource('file')}
            className={`flex items-center gap-2 px-5 py-2 rounded-2xl text-sm font-bold transition-all ${
              videoSource === 'file'
                ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-400'
                : 'bg-slate-800/50 text-slate-400 hover:text-slate-300'
            }`}
          >
            <Video size={16} />
            {t.local_video || '本地视频'}
          </button>
        </div>

        {/* 摄像头/视频预览区域：检测结果视频按上传尺寸比例自适应 */}
        <div
          className="w-full rounded-3xl overflow-hidden border-2 border-white/10 bg-slate-800/50 relative max-h-[70vh]"
          style={
            videoSource === 'file' && resultVideoUrl && resultVideoWidth != null && resultVideoHeight != null
              ? { aspectRatio: `${resultVideoWidth} / ${resultVideoHeight}` }
              : { aspectRatio: '9 / 16' }
          }
        >
          {videoSource === 'camera' ? (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
                autoPlay
              />
              <canvas ref={canvasRef} className="hidden" />
              {!cameraActive && (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-400 absolute inset-0">
                  <Camera size={40} />
                  <p className="text-sm">{t.tap_open_camera || '点击下方按钮打开摄像头'}</p>
                </div>
              )}
              {recording && (
                <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="ml-2 text-white text-sm font-bold">{t.recording || '录制中'}</span>
                </div>
              )}
              {realtimeDetecting && (
                <div className="absolute top-2 left-2 bg-cyan-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  {language === 'zh' ? '实时检测中' : 'Live detect'}
                </div>
              )}
            </>
          ) : (
            <>
              {resultVideoUrl ? (
                <video
                  src={resultVideoUrl}
                  className="w-full h-full object-contain"
                  controls
                  playsInline
                  onError={(e) => {
                    console.error('[前端] 视频播放失败:', e);
                    alert('视频加载失败，请检查后端服务是否正常运行');
                  }}
                />
              ) : (
                // 没有结果时显示上传区域
                <label className="w-full h-full flex flex-col items-center justify-center gap-3 cursor-pointer">
                  {selectedFile ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 text-white">
                      <Upload size={32} className="text-cyan-400" />
                      <p className="text-sm truncate w-full text-center">{selectedFile.name}</p>
                      <p className="text-xs text-slate-400">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-400">
                      <Upload size={40} />
                      <p className="text-sm">{t.tap_upload_video || '点击上传潜水视频'}</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </>
          )}
        </div>

        {/* 操作按钮组：打开摄像头/录制/实时检测/开始识别 */}
        <div className="w-full flex flex-wrap gap-3 justify-center mt-2">
          {videoSource === 'camera' && (
            <>
              <button
                onClick={cameraActive ? toggleRecording : initCamera}
                disabled={loading}
                className={`px-4 py-2.5 rounded-2xl font-bold flex items-center gap-2 text-sm transition-all ${
                  loading
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : cameraActive
                      ? recording
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-cyan-500 hover:bg-cyan-600 text-white'
                }`}
              >
                {cameraActive ? (recording ? <Pause size={16} /> : <Play size={16} />) : <Camera size={16} />}
                {cameraActive ? (recording ? t.stop_record || '停止录制' : t.start_record || '开始录制') : t.open_camera || '打开摄像头'}
              </button>
              {cameraActive && (
                <button
                  onClick={realtimeDetecting ? onStopRealtimeDetect : onStartRealtimeDetect}
                  disabled={loading}
                  className={`px-4 py-2.5 rounded-2xl font-bold flex items-center gap-2 text-sm transition-all ${
                    realtimeDetecting ? 'bg-amber-500/80 hover:bg-amber-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-cyan-400'
                  }`}
                >
                  <Radio size={16} />
                  {realtimeDetecting ? (language === 'zh' ? '结束实时检测' : 'Stop Live') : (language === 'zh' ? '实时检测' : 'Live Detect')}
                </button>
              )}
            </>
          )}

          {/* 开始识别按钮：上传视频或录制后整段检测 */}
          <button
            onClick={uploadForDetect}
            disabled={
              loading ||
              (videoSource === 'camera' && !cameraActive && !recordedBlob) ||
              (videoSource === 'camera' && cameraActive && !recordedBlob && !recording) ||
              (videoSource === 'file' && !selectedFile)
            }
            className={`px-6 py-2.5 rounded-2xl font-bold flex items-center gap-2 text-sm transition-all ${
              loading
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white shadow-lg shadow-cyan-900/30'
            }`}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            {loading ? t.processing || '识别中...' : t.start_detect || '开始探索'}
          </button>
        </div>

        {/* 检测完成提示 */}
        {resultVideoUrl && (
          <div className="w-full p-3 bg-green-900/30 border border-green-500/50 rounded-2xl flex items-center gap-2 text-green-400 text-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>您的视频已完成检测，可在上方播放器中查看</span>
          </div>
        )}

        {/* 录制完成提示：轻量提示，不干扰界面 */}
        {videoSource === 'camera' && recordedBlob && !resultVideoUrl && (
          <p className="text-xs text-green-400 flex items-center gap-1 mt-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {t.record_done || '录制完成，可点击开始探索'}
          </p>
        )}
      </div>

      {/* 底部：结束探索按钮 → 跳转到报告页 */}
      <button
        onClick={handleEndExplore}
        disabled={loading || lastDiveDetections.length === 0}
        className={`w-full py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 mt-2 transition-all ${
          loading || lastDiveDetections.length === 0
            ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
            : 'bg-slate-800 hover:bg-slate-700 text-cyan-400'
        }`}
      >
        <LogOut size={18} />
        {t.end_explore || '结束探索 · 查看报告'}
      </button>
    </div>
  );
};

export default DivingMode;

//
// import React, { useState, useEffect, useRef } from 'react';
// import { Camera, AlertCircle, X, ShieldCheck, Zap } from 'lucide-react';
// import SmartGlassesHUD from './SmartGlassesHUD';
// import { Detection, AIAdvice, MarineLife } from '../types';
// import { MOCK_MARINE_LIFE } from '../constants';
// import { analyzeDetection } from '../services/geminiService';
//
// interface Props {
//   onEndDive: (detections: Detection[]) => void;
//   t: any;
//   language: 'zh' | 'en';
// }
//
// const DivingMode: React.FC<Props> = ({ onEndDive, t, language }) => {
//   const [isCapturing, setIsCapturing] = useState(false);
//   const [detections, setDetections] = useState<Detection[]>([]);
//   const [currentAdvice, setCurrentAdvice] = useState<AIAdvice | null>(null);
//   const [depth, setDepth] = useState(0);
//   const [oxygen, setOxygen] = useState(100);
//   const [diveTime, setDiveTime] = useState(0);
//
//   const detectionInterval = useRef<ReturnType<typeof setInterval> | null>(null);
//   const telemetryInterval = useRef<ReturnType<typeof setInterval> | null>(null);
//
//   useEffect(() => {
//     if (isCapturing) {
//       telemetryInterval.current = setInterval(() => {
//         setDepth(prev => Math.min(30, Math.max(0, prev + (Math.random() - 0.4))));
//         setOxygen(prev => Math.max(0, prev - 0.05));
//         setDiveTime(prev => prev + 1);
//       }, 1000);
//     } else {
//       if (telemetryInterval.current) clearInterval(telemetryInterval.current);
//     }
//     return () => {
//       if (telemetryInterval.current) clearInterval(telemetryInterval.current);
//     };
//   }, [isCapturing]);
//
//   const simulateDetection = async () => {
//     const fish = MOCK_MARINE_LIFE[Math.floor(Math.random() * MOCK_MARINE_LIFE.length)];
//     const newDetection: Detection = {
//       id: Math.random().toString(36).substr(2, 9),
//       fishId: fish.id,
//       timestamp: Date.now(),
//       confidence: 0.85 + Math.random() * 0.1,
//       box: [20 + Math.random() * 40, 20 + Math.random() * 40, 30, 30],
//       depth: depth,
//       isDangerous: fish.isPoisonous
//     };
//
//     setDetections(prev => [...prev, newDetection]);
//
//     const directions = ["LEFT", "RIGHT", "ABOVE", "BELOW", "FRONT"];
//     const direction = directions[Math.floor(Math.random() * directions.length)];
//     const advice = await analyzeDetection(fish, direction, language);
//     setCurrentAdvice(advice);
//
//     setTimeout(() => setCurrentAdvice(null), 5000);
//   };
//
//   const startDiving = () => {
//     setIsCapturing(true);
//     setDiveTime(0);
//     setOxygen(100);
//     detectionInterval.current = setInterval(simulateDetection, 12000);
//   };
//
//   const stopDiving = () => {
//     if (detectionInterval.current) clearInterval(detectionInterval.current);
//     if (telemetryInterval.current) clearInterval(telemetryInterval.current);
//     setIsCapturing(false);
//     onEndDive(detections);
//   };
//
//   return (
//     <div className="relative w-full h-full bg-black overflow-hidden flex flex-col">
//       <div className="absolute inset-0 z-0">
//         <img
//           src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1920&q=80"
//           className="w-full h-full object-cover opacity-60 mix-blend-screen"
//           alt="Underwater Feed"
//         />
//         <div className="absolute inset-0 bg-blue-900/30" />
//         <div className="hud-scanline absolute inset-0 opacity-40" />
//       </div>
//
//       {isCapturing && (
//         <SmartGlassesHUD
//           advice={currentAdvice}
//           depth={depth}
//           oxygen={Math.round(oxygen)}
//           diveTime={diveTime}
//         />
//       )}
//
//       {currentAdvice && (
//         <div
//           className={`absolute border-2 rounded-xl transition-all duration-1000 ${currentAdvice.isDangerous ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.5)]'}`}
//           style={{ top: '30%', left: '40%', width: '20%', height: '25%', pointerEvents: 'none' }}
//         >
//           <div className={`absolute -top-6 left-0 px-2 py-0.5 text-[10px] text-white font-black uppercase rounded ${currentAdvice.isDangerous ? 'bg-red-500' : 'bg-cyan-500'}`}>
//              {currentAdvice.species} {Math.round(90 + Math.random() * 9)}% MATCH
//           </div>
//         </div>
//       )}
//
//       <div className="z-10 mt-auto p-10 flex flex-col items-center">
//         {!isCapturing ? (
//           <div className="glass-panel p-10 rounded-[3rem] text-center max-w-sm border border-white/10 shadow-2xl">
//             <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_10px_30px_rgba(8,145,178,0.5)] transform -rotate-6">
//                 <Camera className="text-white" size={40} />
//             </div>
//             <h2 className="text-3xl font-black mb-3 text-white uppercase tracking-tighter">{t.dive_ready}</h2>
//             <p className="text-slate-400 text-sm mb-8 leading-relaxed">{t.dive_ready_desc}</p>
//             <button
//               onClick={startDiving}
//               className="w-full bg-white text-black font-black py-5 rounded-2xl shadow-xl transition-all hover:bg-cyan-50 active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
//             >
//               <Zap size={20} fill="currentColor" />
//               {t.start_diving}
//             </button>
//           </div>
//         ) : (
//           <div className="flex flex-col items-center gap-6">
//              <div className="flex gap-4">
//                  <button
//                     onClick={stopDiving}
//                     className="bg-red-600 hover:bg-red-500 text-white px-10 py-5 rounded-3xl font-black flex items-center gap-3 backdrop-blur-xl border border-red-400/30 shadow-[0_10px_30px_rgba(220,38,38,0.4)] uppercase tracking-widest text-sm"
//                  >
//                     <X size={24} />
//                     {t.end_dive}
//                  </button>
//                  <div className="glass-panel px-6 py-5 rounded-3xl flex items-center gap-4 border border-emerald-500/30">
//                     <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
//                         <ShieldCheck className="text-emerald-400" size={24} />
//                     </div>
//                     <div>
//                        <div className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">AI Active</div>
//                        <div className="text-sm font-black text-white">{t.safety_shield}</div>
//                     </div>
//                  </div>
//              </div>
//           </div>
//         )}
//       </div>
//
//       {currentAdvice?.isDangerous && (
//          <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-2 rounded-full text-[10px] font-black tracking-[0.2em] flex items-center gap-3 z-50 animate-bounce shadow-2xl uppercase">
//             <AlertCircle size={16} />
//             {t.emergency_warning}
//          </div>
//       )}
//     </div>
//   );
// };
//
// export default DivingMode;
