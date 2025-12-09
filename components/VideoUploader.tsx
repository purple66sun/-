import React, { useRef, useState } from 'react';
import { MAX_FILE_SIZE_MB } from '../constants';

interface VideoUploaderProps {
  onFilesSelected: (files: File[]) => void;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ onFilesSelected }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndPassFiles(Array.from(e.target.files));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndPassFiles(Array.from(e.dataTransfer.files));
    }
  };

  const validateAndPassFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const isVideo = file.type.startsWith('video/');
      const isValidSize = file.size <= MAX_FILE_SIZE_MB * 1024 * 1024;
      
      if (!isVideo) console.warn(`已跳过 ${file.name}: 不是视频文件。`);
      if (!isValidSize) console.warn(`已跳过 ${file.name}: 超过 ${MAX_FILE_SIZE_MB}MB 限制。`);
      
      return isVideo && isValidSize;
    });

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    } else {
        alert(`请上传小于 ${MAX_FILE_SIZE_MB}MB 的视频文件。`);
    }
  };

  return (
    <div
      className={`relative group cursor-pointer flex flex-col items-center justify-center w-full h-48 rounded-2xl border-2 border-dashed transition-all duration-300 ease-in-out
        ${isDragging 
          ? 'border-blue-500 bg-blue-500/10' 
          : 'border-slate-700 bg-slate-800/50 hover:border-blue-400 hover:bg-slate-800'
        }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        multiple
        accept="video/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      
      <div className="flex flex-col items-center space-y-3 text-center p-4">
        <div className={`p-3 rounded-full bg-slate-700 group-hover:bg-blue-600 transition-colors`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-slate-300 group-hover:text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
        </div>
        <div>
          <p className="text-lg font-medium text-slate-200">
            上传视频
          </p>
          <p className="text-sm text-slate-400 mt-1">
            拖拽或点击上传 (最大 {MAX_FILE_SIZE_MB}MB)
          </p>
        </div>
      </div>
    </div>
  );
};

export default VideoUploader;