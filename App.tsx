import React, { useState, useCallback } from 'react';
import VideoUploader from './components/VideoUploader';
import VideoCard from './components/VideoCard';
import { VideoItem, AnalysisStatus, VideoProcessingStatus, SubtitleRemovalConfig } from './types';
import { generateVideoCaptionStream } from './services/geminiService';
import { APP_NAME, APP_DESCRIPTION } from './constants';
import { v4 as uuidv4 } from 'uuid';

const App: React.FC = () => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [stylePrompt, setStylePrompt] = useState<string>('');
  
  // Advanced Subtitle Config State
  const [subtitleConfig, setSubtitleConfig] = useState<SubtitleRemovalConfig>({
    enabled: true,
    mode: 'aggressive', // Default to aggressive based on user feedback
    area: 'full'        // Default to full screen based on user feedback
  });
  
  // Create object URL for preview and add to list
  const handleFilesSelected = useCallback((files: File[]) => {
    // Capture current config snapshot for these files
    const currentConfig = { ...subtitleConfig };

    const newVideos: VideoItem[] = files.map(file => ({
      id: uuidv4(),
      file,
      previewUrl: URL.createObjectURL(file),
      status: AnalysisStatus.IDLE,
      resultText: '',
      processingStatus: VideoProcessingStatus.IDLE,
      subtitleConfig: currentConfig,
    }));

    setVideos(prev => [...newVideos, ...prev]);

    // Automatically start processing the new videos
    newVideos.forEach(video => {
      // 1. Start Gemini Analysis
      processVideoAnalysis(video.id, video.file, stylePrompt);
      
      // 2. Start Video Processing (Subtitle Removal) if enabled
      if (currentConfig.enabled) {
        processVideoSubtitleRemoval(video.id, video.previewUrl, currentConfig);
      }
    });
  }, [stylePrompt, subtitleConfig]);

  const processVideoAnalysis = async (id: string, file: File, currentPrompt: string) => {
    // Update status to Preparing
    setVideos(prev => prev.map(v => v.id === id ? { ...v, status: AnalysisStatus.PREPARING, error: undefined } : v));

    try {
        // Update status to Analyzing immediately before network call for better UX
        setVideos(prev => prev.map(v => v.id === id ? { ...v, status: AnalysisStatus.ANALYZING } : v));

        await generateVideoCaptionStream(
          file, 
          currentPrompt,
          (partialText) => {
            // Update state with streaming text
            setVideos(prev => prev.map(v => v.id === id ? { ...v, resultText: partialText } : v));
          }
        );

        // Mark as completed
        setVideos(prev => prev.map(v => v.id === id ? { ...v, status: AnalysisStatus.COMPLETED } : v));

    } catch (error: any) {
      setVideos(prev => prev.map(v => 
        v.id === id ? { 
          ...v, 
          status: AnalysisStatus.ERROR, 
          error: error.message || '发生未知错误' 
        } : v
      ));
    }
  };

  // Mock function to simulate server-side subtitle removal
  const processVideoSubtitleRemoval = (id: string, url: string, config: SubtitleRemovalConfig) => {
    setVideos(prev => prev.map(v => v.id === id ? { ...v, processingStatus: VideoProcessingStatus.PROCESSING } : v));

    // Simulate processing delay based on intensity
    // Aggressive mode takes longer
    const baseDelay = config.mode === 'aggressive' ? 5000 : 3000;
    const randomVar = Math.random() * 2000;
    const delay = baseDelay + randomVar;
    
    setTimeout(() => {
        setVideos(prev => prev.map(v => v.id === id ? { 
            ...v, 
            processingStatus: VideoProcessingStatus.COMPLETED,
            processedVideoUrl: url 
        } : v));
    }, delay);
  };

  const handleRemove = (id: string) => {
    setVideos(prev => {
      const target = prev.find(v => v.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl); // Cleanup memory
      }
      return prev.filter(v => v.id !== id);
    });
  };

  const handleRetry = (id: string) => {
    const video = videos.find(v => v.id === id);
    if (video) {
        processVideoAnalysis(id, video.file, stylePrompt);
        if (video.subtitleConfig.enabled) {
            processVideoSubtitleRemoval(id, video.previewUrl, video.subtitleConfig);
        }
    }
  };

  return (
    <div className="min-h-screen bg-background text-white p-4 md:p-8 font-sans">
      <div className="max-w-[1920px] mx-auto">
        
        {/* Header Section */}
        <header className="mb-8 border-b border-slate-800 pb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
             <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-tr from-blue-500 to-cyan-400 rounded-lg shadow-lg shadow-blue-500/20">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                    {APP_NAME}
                    </h1>
                </div>
                <p className="text-slate-400 text-base max-w-2xl">
                    {APP_DESCRIPTION}
                </p>
             </div>
             
             {videos.length > 0 && (
                <div className="text-slate-500 text-sm font-medium bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700/50">
                    已生成 {videos.length} 个视频文案
                </div>
             )}
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* Left Content Area (Results) */}
            <main className="flex-1 w-full min-w-0 order-2 lg:order-1">
                {videos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4 gap-6 animate-fade-in-up">
                        {videos.map(video => (
                            <VideoCard 
                            key={video.id} 
                            item={video} 
                            onRetry={handleRetry}
                            onRemove={handleRemove}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="h-[600px] flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/30 text-center p-8">
                        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-slate-600">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                             </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-slate-400 mb-2">准备好创作了吗？</h3>
                        <p className="text-slate-500 max-w-sm">请在右侧侧边栏上传视频，AI 将自动为您分析内容并生成精彩文案。</p>
                    </div>
                )}
            </main>

            {/* Right Sidebar (Controls) */}
            <aside className="w-full lg:w-[340px] xl:w-[380px] shrink-0 space-y-5 order-1 lg:order-2 lg:sticky lg:top-8">
                
                {/* 1. Upload Section */}
                <div className="bg-surface rounded-2xl p-5 border border-slate-700/50 shadow-xl">
                    <h2 className="text-base font-bold mb-4 text-slate-200 flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs">1</span>
                        上传视频
                    </h2>
                    <VideoUploader onFilesSelected={handleFilesSelected} />
                </div>
                
                {/* 2. Smart Tools Section (Updated) */}
                <div className="bg-surface rounded-2xl p-5 border border-slate-700/50 shadow-xl">
                    <h2 className="text-base font-bold mb-4 text-slate-200 flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">2</span>
                        智能处理
                    </h2>
                    
                    <div className="space-y-4">
                        {/* Master Toggle */}
                        <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-700/50">
                            <div className="flex flex-col">
                                <span className="text-sm text-slate-200 font-medium">去除视频字幕</span>
                                <span className="text-[10px] text-slate-500">AI 自动识别并擦除硬字幕</span>
                            </div>
                            <button 
                                onClick={() => setSubtitleConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${subtitleConfig.enabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${subtitleConfig.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        {/* Detailed Settings (Only show if enabled) */}
                        {subtitleConfig.enabled && (
                            <div className="space-y-3 px-1 animate-fade-in-up">
                                {/* Detection Area */}
                                <div className="space-y-1.5">
                                    <label className="text-xs text-slate-400 font-medium ml-1">检测范围</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button 
                                            onClick={() => setSubtitleConfig(prev => ({...prev, area: 'bottom'}))}
                                            className={`p-2 text-xs rounded-lg border transition-all ${subtitleConfig.area === 'bottom' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                                        >
                                            仅底部
                                        </button>
                                        <button 
                                            onClick={() => setSubtitleConfig(prev => ({...prev, area: 'full'}))}
                                            className={`p-2 text-xs rounded-lg border transition-all ${subtitleConfig.area === 'full' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                                        >
                                            全屏搜索
                                        </button>
                                    </div>
                                </div>

                                {/* Removal Strength */}
                                <div className="space-y-1.5">
                                    <label className="text-xs text-slate-400 font-medium ml-1">去除强度</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button 
                                            onClick={() => setSubtitleConfig(prev => ({...prev, mode: 'standard'}))}
                                            className={`p-2 text-xs rounded-lg border transition-all ${subtitleConfig.mode === 'standard' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                                        >
                                            智能填补
                                        </button>
                                        <button 
                                            onClick={() => setSubtitleConfig(prev => ({...prev, mode: 'aggressive'}))}
                                            className={`p-2 text-xs rounded-lg border transition-all ${subtitleConfig.mode === 'aggressive' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                                        >
                                            强力擦除 🔥
                                        </button>
                                    </div>
                                    {subtitleConfig.mode === 'aggressive' && (
                                        <p className="text-[10px] text-orange-400/80 mt-1 ml-1 flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                                            </svg>
                                            强力模式耗时较长，但效果更彻底。
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Style Section */}
                <div className="bg-surface rounded-2xl p-5 border border-slate-700/50 shadow-xl">
                    <h2 className="text-base font-bold mb-4 text-slate-200 flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-xs">3</span>
                        定制风格
                    </h2>
                    <div className="flex flex-col gap-3">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">文案提示词 (选填)</label>
                        <textarea 
                            className="w-full h-32 bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none transition-all placeholder:text-slate-600"
                            placeholder="例如：写一段幽默的小红书文案，带上热门标签..."
                            value={stylePrompt}
                            onChange={(e) => setStylePrompt(e.target.value)}
                        />
                        <p className="text-[10px] text-slate-500">
                        提示：留空则使用默认智能分析模式。
                        </p>
                    </div>
                </div>

            </aside>
        </div>
      </div>
    </div>
  );
};

export default App;