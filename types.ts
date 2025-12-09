export enum AnalysisStatus {
  IDLE = 'IDLE',
  PREPARING = 'PREPARING', // Reading file
  ANALYZING = 'ANALYZING', // Sending to Gemini
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export enum VideoProcessingStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface SubtitleRemovalConfig {
  enabled: boolean;
  mode: 'standard' | 'aggressive'; // standard: 智能填补, aggressive: 强力擦除
  area: 'bottom' | 'full';        // bottom: 仅底部, full: 全屏搜索
}

export interface VideoItem {
  id: string;
  file: File;
  previewUrl: string;
  status: AnalysisStatus; // Text generation status
  resultText: string;
  error?: string;
  
  // New fields for video processing (subtitle removal)
  processingStatus: VideoProcessingStatus;
  processedVideoUrl?: string;
  subtitleConfig: SubtitleRemovalConfig; // Store the config used for this video
}

export interface GenerateConfig {
  stylePrompt: string;
}