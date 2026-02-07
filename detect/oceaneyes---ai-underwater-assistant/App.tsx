import React, { useState, useRef, useEffect } from 'react';
import { AppMode, Detection } from './types';
import GeneralMode from './components/GeneralMode';
import DivingMode from './components/DivingMode';
import ReportView from './components/ReportView';
import CommunityMode from './components/CommunityMode';
import DetectResultMode from './components/DetectResultMode';
import SettingsMode from './components/SettingsMode';
import FishCatalogMode from './components/FishCatalogMode';
import { Home, Waves, ClipboardList, Users, User, Bell } from 'lucide-react';
import { TRANSLATIONS } from './constants';

const App: React.FC = () => {
  // 原有基础状态（完全保留）
  const [activeMode, setActiveMode] = useState<AppMode>(AppMode.GENERAL);
  const [lastDiveDetections, setLastDiveDetections] = useState<Detection[]>([]);
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const t = TRANSLATIONS[language];

  // ===================================== 鱼类识别核心状态/Ref（★删除blobVideoUrl，其余保留★） =====================================
  const [videoSource, setVideoSource] = useState<'camera' | 'file'>('camera');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultVideoUrl, setResultVideoUrl] = useState<string | null>(null); // 直接存后端返回的HTTP播放URL
  const [resultVideoLocalPath, setResultVideoLocalPath] = useState<string | null>(null); // 存储本地文件路径
  const [resultVideoWidth, setResultVideoWidth] = useState<number | null>(null); // 检测后视频宽，用于比例适配
  const [resultVideoHeight, setResultVideoHeight] = useState<number | null>(null); // 检测后视频高
  const [detectError, setDetectError] = useState<string | null>(null);
  const [realtimeDetecting, setRealtimeDetecting] = useState(false); // 摄像头模式实时检测中
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const API_URL = 'http://localhost:5000/DETECT_FISH_VIDEO';
  const API_IMAGE_URL = 'http://localhost:5000/DETECT_FISH_IMAGE';

  // ===================================== 鱼类识别核心方法（★仅修改uploadForDetect，其余完全保留★） =====================================
  // 初始化摄像头（保留）
  const initCamera = async () => {
    if (cameraActive) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 720 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      setDetectError(null);
    } catch (err) {
      console.error('摄像头初始化失败:', err);
      setDetectError(t.camera_error || '无法访问摄像头，请检查权限');
    }
  };

  // 关闭摄像头（保留）
  const stopCamera = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
    setRecording(false);
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
  };

  // 切换录制/停止（保留）
  const toggleRecording = () => {
    if (!cameraActive || loading) return;
    if (!recording) {
      const chunks: BlobPart[] = [];
      const recorder = new MediaRecorder(streamRef.current!, { mimeType: 'video/mp4' });
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => setRecordedBlob(new Blob(chunks, { type: 'video/mp4' }));
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } else {
      mediaRecorderRef.current?.stop();
      setRecording(false);
    }
  };

  // 处理本地视频选择（保留）
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
      setRecordedBlob(null);
      setResultVideoUrl(null);
      setDetectError(null);
    } else {
      setDetectError(t.file_error || '请选择有效的MP4视频文件');
    }
  };

  // 核心识别接口（★仅修改接收后端返回的URL，其余逻辑完全保留★）
  const uploadForDetect = async () => {
    let videoFile: File | null = null;
    if (videoSource === 'file') {
      if (!selectedFile) {
        setDetectError(t.no_file || '请先选择本地视频');
        return;
      }
      videoFile = selectedFile;
    } else {
      if (!recordedBlob) {
        setDetectError(t.no_record || '请先录制视频');
        return;
      }
      videoFile = new File([recordedBlob], `dive-record-${Date.now()}.mp4`, { type: 'video/mp4' });
    }

    const formData = new FormData();
    formData.append('video_file', videoFile!);

    try {
      setLoading(true);
      setDetectError(null);
      setResultVideoUrl(null);
      console.log('[前端] 调用后端检测接口，上传视频：', videoFile?.name);
      const res = await fetch(API_URL, { method: 'POST', body: formData });
      if (!res.ok) throw new Error(`后端响应异常：${res.status}`);
      const result = await res.json();
      console.log('[前端] 后端返回结果：', result);

      if (result.code === 1) {
        const videoPlayUrl = result.result.video_play_url;
        const videoLocalPath = result.result.video_local_path;
        // 确保 videoPlayUrl 是完整的 URL
        const fullVideoUrl = videoPlayUrl.startsWith('http') ? videoPlayUrl : `http://localhost:5000${videoPlayUrl}`;
        setResultVideoUrl(fullVideoUrl);
        setResultVideoLocalPath(videoLocalPath);
        setResultVideoWidth(result.result.video_width ?? null);
        setResultVideoHeight(result.result.video_height ?? null);
        console.log('[前端] 视频播放URL获取成功：', fullVideoUrl);
        const backendDetections = result.result.detections || [];
        const detectResults: Detection[] = [];
        backendDetections.forEach((d: { class_id: number; count: number; is_toxic: boolean }) => {
          for (let i = 0; i < d.count; i++) {
            detectResults.push({
              id: `detect-${Date.now()}-${d.class_id}-${i}`,
              type: 'fish',
              isToxic: d.is_toxic,
              fishId: d.class_id,
              timestamp: new Date().toISOString(),
            });
          }
        });
        setLastDiveDetections(detectResults);
      } else {
        setDetectError(`检测失败：${result.msg}`);
        console.error('[前端] 检测失败：', result.msg);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : '网络错误';
      console.error('[前端] 接口调用失败：', errMsg);
      setDetectError(t.network_error || errMsg);
    } finally {
      setLoading(false);
    }
  };

  // 重置识别状态（保留，无需改）
  const resetDetectState = () => {
    setSelectedFile(null);
    setRecordedBlob(null);
    setResultVideoUrl(null);
    setResultVideoLocalPath(null);
    setResultVideoWidth(null);
    setResultVideoHeight(null);
    setDetectError(null);
    setRecording(false);
    setRealtimeDetecting(false);
    stopCamera();
  };

  // 摄像头模式：实时检测回调，将后端返回的 detections 合并进 lastDiveDetections
  const handleRealtimeDetections = (backendDetections: Array<{ class_id: number; count: number; is_toxic: boolean }>) => {
    const newOnes: Detection[] = [];
    backendDetections.forEach((d) => {
      for (let i = 0; i < d.count; i++) {
        newOnes.push({
          id: `realtime-${Date.now()}-${d.class_id}-${i}-${Math.random().toString(36).slice(2)}`,
          type: 'fish',
          isToxic: d.is_toxic,
          fishId: d.class_id,
          timestamp: new Date().toISOString(),
        });
      }
    });
    setLastDiveDetections((prev) => [...prev, ...newOnes]);
  };

  // ===================================== 页面跳转方法（保留+核心修复：返回不重置） =====================================
  // 结束潜水跳报告页（保留）
  const handleEndDive = (detections: Detection[]) => {
    setLastDiveDetections(detections);
    setActiveMode(AppMode.REPORT);
    resetDetectState();
  };

  // 结果页返回探索页（★核心：只跳转，不清空resultVideoUrl，也不释放资源★）
  const handleBackToDive = () => {
    setActiveMode(AppMode.DIVING);
    // 不重置resultVideoUrl，返回后再次检测会自动覆盖，简单直接
  };

  // ===================================== 核心修复：模式切换不重置结果页状态（保留，必做） =====================================
  useEffect(() => {
    const resetModes = [AppMode.GENERAL, AppMode.REPORT, AppMode.COMMUNITY, AppMode.SETTINGS];
    if (resetModes.includes(activeMode)) {
      resetDetectState();
    }
    // 组件卸载关闭摄像头（保留）
    return () => stopCamera();
  }, [activeMode]);

  // ===================================== 渲染逻辑（★仅保留核心，结果页传resultVideoUrl★） =====================================
  const renderContent = () => {
    switch (activeMode) {
      case AppMode.GENERAL:
        return <GeneralMode t={t} language={language} onOpenFishCatalog={() => setActiveMode(AppMode.FISH_CATALOG)} />;
      case AppMode.FISH_CATALOG:
        return <FishCatalogMode onBack={() => setActiveMode(AppMode.GENERAL)} t={t} language={language} />;
      case AppMode.DIVING:
        return (
          <DivingMode
            onEndDive={handleEndDive}
            t={t}
            language={language}
            videoSource={videoSource}
            setVideoSource={setVideoSource}
            selectedFile={selectedFile}
            handleVideoFileChange={handleVideoFileChange}
            cameraActive={cameraActive}
            recording={recording}
            recordedBlob={recordedBlob}
            loading={loading}
            resultVideoUrl={resultVideoUrl}
            resultVideoLocalPath={resultVideoLocalPath}
            resultVideoWidth={resultVideoWidth}
            resultVideoHeight={resultVideoHeight}
            detectError={detectError}
            initCamera={initCamera}
            toggleRecording={toggleRecording}
            uploadForDetect={uploadForDetect}
            videoRef={videoRef}
            lastDiveDetections={lastDiveDetections}
            realtimeDetecting={realtimeDetecting}
            onStartRealtimeDetect={() => { setLastDiveDetections([]); setRealtimeDetecting(true); }}
            onStopRealtimeDetect={() => setRealtimeDetecting(false)}
            onRealtimeDetections={handleRealtimeDetections}
            apiImageUrl={API_IMAGE_URL}
          />
        );
      // 结果页：直接传resultVideoUrl（后端返回的HTTP URL）
      case AppMode.DETECT_RESULT:
        return (
          <DetectResultMode
            t={t}
            detectedVideoUrl={resultVideoUrl}
            onBack={handleBackToDive}
            onEndToReport={handleEndDive}
            lastDiveDetections={lastDiveDetections}
            loading={loading}
          />
        );
      case AppMode.REPORT:
        return <ReportView detections={lastDiveDetections} onBack={() => setActiveMode(AppMode.GENERAL)} onShare={() => setActiveMode(AppMode.COMMUNITY)} t={t} language={language} />;
      case AppMode.COMMUNITY: return <CommunityMode t={t} language={language} />;
      case AppMode.SETTINGS: return <SettingsMode onBack={() => setActiveMode(AppMode.GENERAL)} language={language} setLanguage={setLanguage} t={t} />;
      default: return <GeneralMode t={t} language={language} onOpenFishCatalog={() => setActiveMode(AppMode.FISH_CATALOG)} />;
    }
  };

  // ===================================== 原有JSX+导航（完全保留，一字不改） =====================================
  return (
    <div className="flex flex-col h-screen w-full relative bg-slate-950 overflow-hidden">
      {/* Top Header */}
      {activeMode !== AppMode.DIVING && activeMode !== AppMode.REPORT && activeMode !== AppMode.SETTINGS && activeMode !== AppMode.DETECT_RESULT && activeMode !== AppMode.FISH_CATALOG && (
        <header className="p-6 flex items-center justify-between z-20 bg-slate-950/50 backdrop-blur-xl border-b border-white/5">
            <div>
                <h1 className="text-2xl font-black text-white tracking-tighter">{t.hub_title}</h1>
                <div className="flex items-center gap-2">
                   <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
                   <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black">{t.hub_subtitle}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <button className="p-2.5 glass-panel rounded-2xl text-slate-400 hover:text-white transition-colors relative">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-cyan-500 rounded-full border-2 border-slate-950" />
                </button>
                <button
                  onClick={() => setActiveMode(AppMode.SETTINGS)}
                  className="p-2.5 glass-panel rounded-2xl text-slate-300 hover:text-cyan-400 transition-colors"
                >
                    <User size={20} />
                </button>
            </div>
        </header>
      )}

      {/* Main Feature Area - min-h-0 允许 flex 子项正确收缩，使 ReportView 等可滚动 */}
      <main className="flex-1 min-h-0 overflow-hidden relative">
        {renderContent()}
      </main>

      {/* Persistent Bottom Navigation Bar */}
      {activeMode !== AppMode.DIVING && activeMode !== AppMode.DETECT_RESULT && activeMode !== AppMode.FISH_CATALOG && (
        <nav className="absolute bottom-0 inset-x-0 h-24 bg-slate-950/80 backdrop-blur-2xl border-t border-white/5 px-8 flex items-center justify-between z-30">
          <NavButton
            active={activeMode === AppMode.GENERAL}
            onClick={() => setActiveMode(AppMode.GENERAL)}
            icon={<Home size={24} />}
            label={t.nav_home}
          />
          <NavButton
            active={activeMode === AppMode.COMMUNITY}
            onClick={() => setActiveMode(AppMode.COMMUNITY)}
            icon={<Users size={24} />}
            label={t.nav_community}
          />

          <div className="relative -mt-16 group">
            <div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
            <button
              onClick={() => setActiveMode(AppMode.DIVING)}
              className="relative w-18 h-18 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-cyan-900/40 transition-all transform hover:scale-110 active:scale-95 border-4 border-slate-950"
            >
                <Waves size={32} className="text-white" />
            </button>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-cyan-400 uppercase tracking-widest">{t.nav_dive}</div>
          </div>

          <NavButton
            active={activeMode === AppMode.REPORT}
            onClick={() => lastDiveDetections.length > 0 ? setActiveMode(AppMode.REPORT) : null}
            icon={<ClipboardList size={24} />}
            label={t.nav_log}
            disabled={lastDiveDetections.length === 0}
          />
          <NavButton
            active={activeMode === AppMode.SETTINGS}
            onClick={() => setActiveMode(AppMode.SETTINGS)}
            icon={<User size={24} />}
            label={t.nav_me}
          />
        </nav>
      )}
    </div>
  );
};

// 原有NavButton组件（完全保留）
interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex flex-col items-center gap-1.5 transition-all relative ${disabled ? 'opacity-10 grayscale' : ''} ${active ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
  >
    {active && <div className="absolute -top-4 w-1 h-1 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee]" />}
    {icon}
    <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
  </button>
);

export default App;

// import React, { useState, useRef, useEffect } from 'react';
// import { AppMode, Detection } from './types';
// import GeneralMode from './components/GeneralMode';
// import DivingMode from './components/DivingMode';
// import ReportView from './components/ReportView';
// import CommunityMode from './components/CommunityMode';
// import DetectResultMode from './components/DetectResultMode'; // 已导入，保留
// import SettingsMode from './components/SettingsMode';
// import { Home, Waves, ClipboardList, Users, User, Bell } from 'lucide-react';
// import { TRANSLATIONS } from './constants';
//
// const App: React.FC = () => {
//   // 原有所有状态：完全保留，未做任何修改
//   const [activeMode, setActiveMode] = useState<AppMode>(AppMode.GENERAL);
//   const [lastDiveDetections, setLastDiveDetections] = useState<Detection[]>([]);
//   const [language, setLanguage] = useState<'zh' | 'en'>('zh');
//   const t = TRANSLATIONS[language];
//
//   // ===================================== 鱼类识别核心状态/Ref（原有+新增blobVideoUrl已存在） =====================================
//   const [videoSource, setVideoSource] = useState<'camera' | 'file'>('camera');
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);
//   const [cameraActive, setCameraActive] = useState(false);
//   const [recording, setRecording] = useState(false);
//   const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [resultVideoUrl, setResultVideoUrl] = useState<string | null>(null); // 原始Base64 URL
//   const [blobVideoUrl, setBlobVideoUrl] = useState<string | null>(null); // 用于播放的Blob URL（核心）
//   const [detectError, setDetectError] = useState<string | null>(null);
//   const streamRef = useRef<MediaStream | null>(null);
//   const mediaRecorderRef = useRef<MediaRecorder | null>(null);
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const API_URL = 'http://localhost:5000/DETECT_FISH_VIDEO';
//
//   // ===================================== 新增核心工具方法：Base64转Blob URL（解决大视频播放核心问题） =====================================
//   const base64ToBlobUrl = (base64Str: string) => {
//     try {
//       // 拆分Base64前缀和实际数据（兼容已拼接的dataURL）
//       const [prefix, data] = base64Str.split(',');
//       if (!data) throw new Error('Base64格式错误，无有效视频数据');
//       // Base64解码为二进制数组
//       const byteCharacters = atob(data);
//       const byteNumbers = new Array(byteCharacters.length);
//       for (let i = 0; i < byteCharacters.length; i++) {
//         byteNumbers[i] = byteCharacters.charCodeAt(i);
//       }
//       const byteArray = new Uint8Array(byteNumbers);
//       // 生成MP4格式Blob对象
//       const blob = new Blob([byteArray], { type: 'video/mp4' });
//       // 生成浏览器可播放的Blob URL
//       const blobUrl = URL.createObjectURL(blob);
//       console.log('[前端] Base64转Blob URL成功，播放地址：', blobUrl);
//       return blobUrl;
//     } catch (err) {
//       const errMsg = err instanceof Error ? err.message : 'Base64转视频播放地址失败';
//       console.error('[前端] 转换失败：', errMsg);
//       setDetectError(errMsg);
//       return null;
//     }
//   };
//
//   // ===================================== 鱼类识别核心方法（仅删除延迟跳转，其余完全保留） =====================================
//   // 初始化摄像头（原有，完全保留）
//   const initCamera = async () => {
//     if (cameraActive) return;
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: { facingMode: 'environment', width: { ideal: 720 }, height: { ideal: 1080 } },
//         audio: false,
//       });
//       streamRef.current = stream;
//       if (videoRef.current) {
//         videoRef.current.srcObject = stream;
//         await videoRef.current.play();
//       }
//       setCameraActive(true);
//       setDetectError(null);
//     } catch (err) {
//       console.error('摄像头初始化失败:', err);
//       setDetectError(t.camera_error || '无法访问摄像头，请检查权限/设备');
//     }
//   };
//
//   // 关闭摄像头（原有，完全保留）
//   const stopCamera = () => {
//     if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
//     if (videoRef.current) videoRef.current.srcObject = null;
//     setCameraActive(false);
//     setRecording(false);
//     if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
//   };
//
//   // 切换录制/停止（原有，完全保留）
//   const toggleRecording = () => {
//     if (!cameraActive || loading) return;
//     if (!recording) {
//       const chunks: BlobPart[] = [];
//       const recorder = new MediaRecorder(streamRef.current!, { mimeType: 'video/mp4' });
//       recorder.ondataavailable = (e) => chunks.push(e.data);
//       recorder.onstop = () => setRecordedBlob(new Blob(chunks, { type: 'video/mp4' }));
//       mediaRecorderRef.current = recorder;
//       recorder.start();
//       setRecording(true);
//     } else {
//       mediaRecorderRef.current?.stop();
//       setRecording(false);
//     }
//   };
//
//   // 处理本地视频文件选择（原有，完全保留）
//   const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file && file.type.startsWith('video/')) {
//       setSelectedFile(file);
//       setRecordedBlob(null);
//       setResultVideoUrl(null);
//       setBlobVideoUrl(null); // 新增：清空旧Blob URL
//       setDetectError(null);
//     } else {
//       setDetectError(t.file_error || '请选择有效的视频文件（MP4/AVI/MOV）');
//     }
//   };
//
//   // 核心识别接口（★仅删除延迟跳转，其余原有逻辑完全保留★）
//   const uploadForDetect = async () => {
//     let videoFile: File | null = null;
//     if (videoSource === 'file') {
//       if (!selectedFile) {
//         setDetectError(t.no_file || '请先选择本地视频文件');
//         return;
//       }
//       videoFile = selectedFile;
//     } else {
//       if (!recordedBlob) {
//         setDetectError(t.no_record || '请先录制摄像头视频');
//         return;
//       }
//       videoFile = new File([recordedBlob], `dive-record-${Date.now()}.mp4`, { type: 'video/mp4' });
//     }
//
//     const formData = new FormData();
//     formData.append('video_file', videoFile!);
//
//     try {
//       setLoading(true);
//       setDetectError(null);
//       setResultVideoUrl(null);
//       setBlobVideoUrl(null); // 新增：清空旧Blob URL
//       console.log('[前端] 开始调用后端识别接口，上传视频名：', videoFile?.name);
//       // 调用接口
//       const res = await fetch(API_URL, { method: 'POST', body: formData });
//       // 校验响应是否正常
//       if (!res.ok) throw new Error(`后端接口响应异常，状态码：${res.status}`);
//       const result = await res.json();
//       console.log('[前端] 后端接口返回数据：', result);
//       if (result.code === 1) {
//         // 1. 拼接Base64 URL（原有逻辑）
//         const playableUrl = `data:video/mp4;base64,${result.result.output_video_base64}`;
//         console.log('[前端] 拼接Base64 URL成功，长度：', playableUrl.length);
//         // 2. 仅赋值状态，删除延迟跳转（跳转交给下方useEffect监听）
//         setResultVideoUrl(playableUrl);
//         // 构造检测结果（原有逻辑）
//         const detectResults: Detection[] = [
//           { id: `detect-${Date.now()}`, type: 'fish', isToxic: true, fishId: 0, timestamp: new Date().toISOString() }
//         ];
//         setLastDiveDetections(detectResults);
//       } else {
//         setDetectError(`识别失败：${result.msg}`);
//         console.error('[前端] 后端识别失败：', result.msg);
//       }
//     } catch (err) {
//       const errMsg = err instanceof Error ? err.message : '未知网络错误';
//       console.error('[前端] 接口调用失败:', errMsg);
//       setDetectError(t.network_error || `网络错误：${errMsg}`);
//     } finally {
//       setLoading(false);
//     }
//   };
//
//   // 重置识别状态（★新增清空blobVideoUrl，其余原有逻辑保留★）
//   const resetDetectState = () => {
//     setSelectedFile(null);
//     setRecordedBlob(null);
//     setResultVideoUrl(null);
//     setBlobVideoUrl(null); // 新增：清空Blob URL
//     setDetectError(null);
//     setRecording(false);
//     stopCamera();
//   };
//
//   // ===================================== 原有方法+优化结果页辅助方法 =====================================
//   // 原有：结束潜水跳报告页（完全保留）
//   const handleEndDive = (detections: Detection[]) => {
//     setLastDiveDetections(detections);
//     setActiveMode(AppMode.REPORT);
//     resetDetectState();
//   };
//
//   // ★优化：结果页返回探索页（释放Blob URL+清空状态，避免内存泄漏/旧视频残留）★
//   const handleBackToDive = () => {
//     setActiveMode(AppMode.DIVING);
//     // 释放Blob URL资源
//     if (blobVideoUrl) URL.revokeObjectURL(blobVideoUrl);
//     setResultVideoUrl(null);
//     setBlobVideoUrl(null);
//   };
//
//   // ===================================== 新增核心useEffect（Blob URL转换/跳转/资源释放） =====================================
//   // 1. 组件卸载时：释放Blob URL+关闭摄像头（核心，避免内存泄漏）
//   useEffect(() => {
//     return () => {
//       stopCamera();
//       if (blobVideoUrl) URL.revokeObjectURL(blobVideoUrl);
//     };
//   }, [blobVideoUrl]);
//
//   // 2. 模式切换时：仅非潜水/非结果页重置状态（★原有修复+新增释放Blob URL★）
//   useEffect(() => {
//     const resetModes = [AppMode.GENERAL, AppMode.REPORT, AppMode.COMMUNITY, AppMode.SETTINGS];
//     if (resetModes.includes(activeMode)) {
//       // 切换模式时释放Blob URL
//       if (blobVideoUrl) URL.revokeObjectURL(blobVideoUrl);
//       resetDetectState();
//     }
//   }, [activeMode, blobVideoUrl]);
//
//   // 3. 监听Base64 URL变化：自动转换为Blob URL（核心播放逻辑）
//   useEffect(() => {
//     // 先释放旧的Blob URL，避免内存泄漏
//     if (blobVideoUrl) URL.revokeObjectURL(blobVideoUrl);
//     // 当Base64 URL有效时，转换为可播放的Blob URL
//     if (resultVideoUrl && resultVideoUrl.length > 1000 && activeMode !== AppMode.DETECT_RESULT) {
//       const newBlobUrl = base64ToBlobUrl(resultVideoUrl);
//       if (newBlobUrl) setBlobVideoUrl(newBlobUrl);
//     }
//   }, [resultVideoUrl, activeMode, blobVideoUrl]);
//
//   // 4. 监听Blob URL变化：自动跳转到结果页（替代原延迟跳转，更稳定）
//   useEffect(() => {
//     if (blobVideoUrl && activeMode !== AppMode.DETECT_RESULT) {
//       console.log('[前端] Blob URL生成完成，自动跳转到结果页播放');
//       setActiveMode(AppMode.DETECT_RESULT);
//     }
//   }, [blobVideoUrl, activeMode]);
//
//   // ===================================== 渲染逻辑（★仅修改结果页传参，其余完全保留★） =====================================
//   const renderContent = () => {
//     switch (activeMode) {
//       case AppMode.GENERAL:
//         return <GeneralMode t={t} />;
//       case AppMode.DIVING:
//         return (
//           <DivingMode
//             onEndDive={handleEndDive}
//             t={t}
//             language={language}
//             videoSource={videoSource}
//             setVideoSource={setVideoSource}
//             selectedFile={selectedFile}
//             handleVideoFileChange={handleVideoFileChange}
//             cameraActive={cameraActive}
//             recording={recording}
//             recordedBlob={recordedBlob}
//             loading={loading}
//             resultVideoUrl={resultVideoUrl}
//             detectError={detectError}
//             initCamera={initCamera}
//             toggleRecording={toggleRecording}
//             uploadForDetect={uploadForDetect}
//             videoRef={videoRef}
//             lastDiveDetections={lastDiveDetections}
//           />
//         );
//       // ★核心修改：结果页传递Blob URL（而非原始Base64），其余props保留★
//       case AppMode.DETECT_RESULT:
//         return (
//           <DetectResultMode
//             t={t}
//             detectedVideoUrl={blobVideoUrl} // 关键：传可播放的Blob URL
//             onBack={handleBackToDive}
//             onEndToReport={handleEndDive}
//             lastDiveDetections={lastDiveDetections}
//             loading={loading}
//           />
//         );
//       case AppMode.REPORT:
//         return (
//           <ReportView
//             detections={lastDiveDetections}
//             onBack={() => setActiveMode(AppMode.GENERAL)}
//             onShare={() => setActiveMode(AppMode.COMMUNITY)}
//             t={t}
//             language={language}
//           />
//         );
//       case AppMode.COMMUNITY:
//         return <CommunityMode t={t} language={language} />;
//       case AppMode.SETTINGS:
//         return (
//           <SettingsMode
//             onBack={() => setActiveMode(AppMode.GENERAL)}
//             language={language}
//             setLanguage={setLanguage}
//             t={t}
//           />
//         );
//       default:
//         return <GeneralMode t={t} />;
//     }
//   };
//
//   // ===================================== 原有JSX+导航（完全保留，一字未改） =====================================
//   return (
//     <div className="flex flex-col h-screen max-w-md mx-auto shadow-2xl relative bg-slate-950 overflow-hidden border-x border-slate-900">
//       {/* Top Header */}
//       {activeMode !== AppMode.DIVING && activeMode !== AppMode.REPORT && activeMode !== AppMode.SETTINGS && activeMode !== AppMode.DETECT_RESULT && (
//         <header className="p-6 flex items-center justify-between z-20 bg-slate-950/50 backdrop-blur-xl border-b border-white/5">
//             <div>
//                 <h1 className="text-2xl font-black text-white tracking-tighter">{t.hub_title}</h1>
//                 <div className="flex items-center gap-2">
//                    <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
//                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black">{t.hub_subtitle}</p>
//                 </div>
//             </div>
//             <div className="flex items-center gap-3">
//                 <button className="p-2.5 glass-panel rounded-2xl text-slate-400 hover:text-white transition-colors relative">
//                     <Bell size={20} />
//                     <span className="absolute top-2 right-2 w-2 h-2 bg-cyan-500 rounded-full border-2 border-slate-950" />
//                 </button>
//                 <button
//                   onClick={() => setActiveMode(AppMode.SETTINGS)}
//                   className="p-2.5 glass-panel rounded-2xl text-slate-300 hover:text-cyan-400 transition-colors"
//                 >
//                     <User size={20} />
//                 </button>
//             </div>
//         </header>
//       )}
//
//       {/* Main Feature Area */}
//       <main className="flex-1 overflow-hidden relative">
//         {renderContent()}
//       </main>
//
//       {/* Persistent Bottom Navigation Bar */}
//       {activeMode !== AppMode.DIVING && activeMode !== AppMode.DETECT_RESULT && (
//         <nav className="absolute bottom-0 inset-x-0 h-24 bg-slate-950/80 backdrop-blur-2xl border-t border-white/5 px-8 flex items-center justify-between z-30">
//           <NavButton
//             active={activeMode === AppMode.GENERAL}
//             onClick={() => setActiveMode(AppMode.GENERAL)}
//             icon={<Home size={24} />}
//             label={t.nav_home}
//           />
//           <NavButton
//             active={activeMode === AppMode.COMMUNITY}
//             onClick={() => setActiveMode(AppMode.COMMUNITY)}
//             icon={<Users size={24} />}
//             label={t.nav_community}
//           />
//
//           <div className="relative -mt-16 group">
//             <div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
//             <button
//               onClick={() => setActiveMode(AppMode.DIVING)}
//               className="relative w-18 h-18 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-cyan-900/40 transition-all transform hover:scale-110 active:scale-95 border-4 border-slate-950"
//             >
//                 <Waves size={32} className="text-white" />
//             </button>
//             <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-cyan-400 uppercase tracking-widest">{t.nav_dive}</div>
//           </div>
//
//           <NavButton
//             active={activeMode === AppMode.REPORT}
//             onClick={() => lastDiveDetections.length > 0 ? setActiveMode(AppMode.REPORT) : null}
//             icon={<ClipboardList size={24} />}
//             label={t.nav_log}
//             disabled={lastDiveDetections.length === 0}
//           />
//           <NavButton
//             active={activeMode === AppMode.SETTINGS}
//             onClick={() => setActiveMode(AppMode.SETTINGS)}
//             icon={<User size={24} />}
//             label={t.nav_me}
//           />
//         </nav>
//       )}
//     </div>
//   );
// };
//
// // 原有NavButton组件（完全保留，一字未改）
// interface NavButtonProps {
//   active: boolean;
//   onClick: () => void;
//   icon: React.ReactNode;
//   label: string;
//   disabled?: boolean;
// }
//
// const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label, disabled }) => (
//   <button
//     onClick={onClick}
//     disabled={disabled}
//     className={`flex flex-col items-center gap-1.5 transition-all relative ${disabled ? 'opacity-10 grayscale' : ''} ${active ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
//   >
//     {active && <div className="absolute -top-4 w-1 h-1 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee]" />}
//     {icon}
//     <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
//   </button>
// );
//
// export default App;