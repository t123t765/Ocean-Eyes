import React from 'react';
import { ArrowLeft, LogOut, Loader2 } from 'lucide-react';
import { Detection } from '../types';

interface DetectResultModeProps {
  t: Record<string, string>;
  detectedVideoUrl: string | null;
  onBack: () => void;
  onEndToReport: (detections: Detection[]) => void;
  lastDiveDetections: Detection[];
  loading: boolean;
}

const DetectResultMode: React.FC<DetectResultModeProps> = ({
  t,
  detectedVideoUrl,
  onBack,
  onEndToReport,
  lastDiveDetections,
  loading
}) => {
  // ★★★ 新增核心日志：打印实际接收到的URL，方便排查，必加！
  console.log('[结果页] 实际接收到的视频URL：', detectedVideoUrl);
  console.log('[结果页] URL是否为有效HTTP地址：', detectedVideoUrl && detectedVideoUrl.startsWith('http://'));

  return (
    <div className="h-full w-full flex flex-col items-center justify-between p-4 sm:p-6 bg-slate-950 relative">
      {/* 背景装饰（保留） */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />

      {/* 顶部返回按钮（保留） */}
      <div className="w-full z-10 flex justify-start">
        <button
          onClick={onBack}
          disabled={loading}
          className="px-3 py-2 glass-panel rounded-lg flex items-center gap-2 text-white text-sm disabled:opacity-50"
        >
          <ArrowLeft size={18} />
          {t.back || '返回'}
        </button>
      </div>

      {/* ★★★ 核心视频渲染区域：直接替换这部分，修复判断逻辑 ★★★ */}
      <div className="flex-1 w-full flex flex-col items-center justify-center z-10 p-2">
        <h3 className="text-white font-bold mb-4 text-center">
          {t.detect_result_title || '鱼类识别结果'}
        </h3>

        {/* 状态1：加载中 */}
        {loading ? (
          <div className="w-full aspect-[9/16] rounded-3xl bg-slate-800/50 flex items-center justify-center">
            <Loader2 size={40} className="text-cyan-500 animate-spin" />
            <p className="ml-3 text-slate-400 text-sm">{t.processing || '视频处理中...'}</p>
          </div>
        ) : (
          // 状态2：非加载中 → 判断是否有有效HTTP URL
          detectedVideoUrl && detectedVideoUrl.startsWith('http://') ? (
            // ✅ 有效URL：渲染视频标签，直接播放后端的HTTP地址
            <div className="w-full aspect-[9/16] rounded-3xl overflow-hidden border-2 border-cyan-500/50 relative">
              <video
                src={detectedVideoUrl}
                className="w-full h-full object-cover"
                controls
                playsInline
                preload="metadata"
                autoPlay
                muted
                // 加播放错误日志，方便最后排查
                onError={(e) => {
                  console.error('[视频播放错误]', e.target?.error);
                  alert('视频播放失败，请检查浏览器是否支持MP4：' + detectedVideoUrl);
                }}
              >
                你的浏览器不支持HTML5视频播放，请升级Chrome/Edge
              </video>
              <div className="absolute top-2 left-2 bg-cyan-500/80 text-white text-xs px-2 py-1 rounded-full font-bold">
                {t.detect_result || '识别结果'}
              </div>
            </div>
          ) : (
            // ❌ 无效URL：显示暂无视频
            <div className="w-full aspect-[9/16] rounded-3xl bg-slate-800/50 flex flex-col items-center justify-center gap-4 p-6 text-slate-400">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <p className="text-center text-sm">{t.no_result_video || '暂无有效识别结果视频'}</p>
              <p className="text-center text-xs mt-2">当前URL：{detectedVideoUrl || '空'}</p>
            </div>
          )
        )}
      </div>

      {/* 底部跳报告页按钮（保留） */}
      <button
        onClick={() => onEndToReport(lastDiveDetections)}
        disabled={loading || !detectedVideoUrl || !detectedVideoUrl.startsWith('http://')}
        className={`w-full py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 mt-2 transition-all z-10
          ${loading || !detectedVideoUrl || !detectedVideoUrl.startsWith('http://')
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

export default DetectResultMode;

// // src/components/DetectResultMode.tsx
// import React from 'react';
// import { ArrowLeft, LogOut, Loader2 } from 'lucide-react';
// import { Detection } from '../types';
//
// interface DetectResultModeProps {
//   t: Record<string, string>;
//   detectedVideoUrl: string | null; // 识别后的视频URL
//   onBack: () => void; // 返回探索页
//   onEndToReport: (detections: Detection[]) => void; // 跳报告页
//   lastDiveDetections: Detection[];
//   loading: boolean; // 加载状态（关键，新增传递）
// }
//
// const DetectResultMode: React.FC<DetectResultModeProps> = ({
//   t,
//   detectedVideoUrl,
//   onBack,
//   onEndToReport,
//   lastDiveDetections,
//   loading
// }) => {
//   // 控制台打印状态，方便调试
//   console.log('[结果页] 接收的视频URL：', detectedVideoUrl ? '有值，长度：'+detectedVideoUrl.length : 'null');
//   console.log('[结果页] 加载状态：', loading);
//
//   return (
//     <div className="h-full w-full flex flex-col items-center justify-between p-6 bg-slate-950 relative">
//       {/* 背景装饰，和探索页统一 */}
//       <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
//       <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
//
//       {/* 顶部返回按钮 */}
//       <div className="w-full z-10 flex justify-start">
//         <button
//           onClick={onBack}
//           disabled={loading}
//           className="px-3 py-2 glass-panel rounded-lg flex items-center gap-2 text-white text-sm disabled:opacity-50"
//         >
//           <ArrowLeft size={18} />
//           {t.back || '返回'}
//         </button>
//       </div>
//
//       {/* 核心视频区域：加载/无视频/正常播放 三种状态 */}
//       <div className="flex-1 w-full flex flex-col items-center justify-center z-10 p-2">
//         <h3 className="text-white font-bold mb-4 text-center">
//           {t.detect_result_title || '鱼类识别结果'}
//         </h3>
//
//         {loading ? (
//           // 状态1：加载中，显示加载动画
//           <div className="w-full aspect-[9/16] rounded-3xl bg-slate-800/50 flex items-center justify-center">
//             <Loader2 size={40} className="text-cyan-500 animate-spin" />
//             <p className="ml-3 text-slate-400 text-sm">{t.processing || '视频处理中...'}</p>
//           </div>
//         ) : !detectedVideoUrl || detectedVideoUrl.length < 1000 ? (
//           // 状态2：无有效视频，显示友好提示（URL为空/过短视为无效）
//           <div className="w-full aspect-[9/16] rounded-3xl bg-slate-800/50 flex flex-col items-center justify-center gap-4 p-6 text-slate-400">
//             <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
//               <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
//             </svg>
//             <p className="text-center text-sm">{t.no_result_video || '暂无有效识别结果视频'}</p>
//             <p className="text-center text-xs mt-2">请重新上传视频尝试</p>
//           </div>
//         ) : (
//           // 状态3：正常播放，显示带控件的视频
//           <div className="w-full aspect-[9/16] rounded-3xl overflow-hidden border-2 border-cyan-500/50 relative">
//             <video
//               src={detectedVideoUrl}
//               className="w-full h-full object-cover"
//               controls
//               playsInline
//               preload="auto"
//               poster="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzEwMTgyYSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkltZXJhIiBmb250LXNpemU9IjE2IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+5peg5rWL5YiG5oqA5oiQ5a2XPC90ZXh0Pjwvc3ZnPg=="
//             >
//               你的浏览器不支持HTML5视频播放，请升级浏览器
//             </video>
//             <div className="absolute top-2 left-2 bg-cyan-500/80 text-white text-xs px-2 py-1 rounded-full font-bold">
//               {t.detect_result || '识别结果'}
//             </div>
//           </div>
//         )}
//       </div>
//
//       {/* 底部跳报告页按钮 */}
//       <button
//         onClick={() => onEndToReport(lastDiveDetections)}
//         disabled={loading || lastDiveDetections.length === 0 || !detectedVideoUrl}
//         className={`w-full py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 mt-2 transition-all z-10
//           ${loading || lastDiveDetections.length === 0 || !detectedVideoUrl
//             ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
//             : 'bg-slate-800 hover:bg-slate-700 text-cyan-400'
//           }`}
//       >
//         <LogOut size={18} />
//         {t.end_explore || '结束探索 · 查看报告'}
//       </button>
//     </div>
//   );
// };
//
// export default DetectResultMode;