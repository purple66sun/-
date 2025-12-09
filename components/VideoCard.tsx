import React from 'react';
import { VideoItem, AnalysisStatus } from '../types';
import ReactMarkdown from 'react-markdown';

interface VideoCardProps {
  item: VideoItem;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ item, onRetry, onRemove }) => {
  const isAnalyzing = item.status === AnalysisStatus.ANALYZING || item.status === AnalysisStatus.PREPARING;
  const isError = item.status === AnalysisStatus.ERROR;
  const isCompleted = item.status === AnalysisStatus.COMPLETED;

  return (
    <div className="flex flex-col bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-lg transition-all hover:shadow-slate-700/20 hover:border-slate-600">
      {/* Video Preview Section */}
      <div className="relative w-full aspect-video bg-black flex items-center justify-center group">
        <video 
          src={item.previewUrl} 
          className="w-full h-full object-contain"
          controls
        />
        
        {/* Overlay Status */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm z-10 pointer-events-none">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <span className="text-xs font-semibold tracking-wider uppercase text-blue-400 animate-pulse">
              {item.status === AnalysisStatus.PREPARING ? '文件读取中...' : 'AI 思考中...'}
            </span>
          </div>
        )}

        {/* Delete Button */}
        <button 
          onClick={() => onRemove(item.id)}
          className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-200 z-20"
          title="删除"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content Section */}
      <div className="p-5 flex-1 flex flex-col border-t border-slate-700">
        {/* Title / Metadata */}
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-blue-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813a3.75 3.75 0 0 0 2.576-2.576l.813-2.846A.75.75 0 0 1 9 4.5ZM9 15.75a.75.75 0 0 1 .721.544l.178.622a2.25 2.25 0 0 0 1.65 1.65l.622.178a.75.75 0 0 1 0 1.442l-.622.178a2.25 2.25 0 0 0-1.65 1.65l-.178.622a.75.75 0 0 1-1.442 0l-.178-.622a2.25 2.25 0 0 0-1.65 1.65l-.622-.178a.75.75 0 0 1 0-1.442l.622-.178a2.25 2.25 0 0 0 1.65-1.65l.178-.622a.75.75 0 0 1 .721-.544Z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold tracking-wide">AI 文案生成</span>
            </div>
            
            {/* File Info */}
            <span className="text-xs text-slate-500 truncate max-w-[150px]" title={item.file.name}>
                {item.file.name}
            </span>
        </div>

        {/* Output Text Area */}
        <div className="flex-1 min-h-[120px] text-sm text-slate-300 leading-relaxed bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
           {item.resultText ? (
             <div className="prose prose-invert prose-sm max-w-none">
                 <ReactMarkdown>{item.resultText}</ReactMarkdown>
             </div>
           ) : isError ? (
             <div className="text-red-400 flex flex-col items-center justify-center h-full gap-2">
                <span className="text-center text-xs px-2">{item.error || '生成失败'}</span>
                <button onClick={() => onRetry(item.id)} className="text-xs underline hover:text-red-300">重试</button>
             </div>
           ) : (
             <div className="flex items-center justify-center h-full text-slate-600 italic">
                等待分析中...
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default VideoCard;