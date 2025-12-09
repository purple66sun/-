export enum AnalysisStatus {
  IDLE = 'IDLE',
  PREPARING = 'PREPARING', // Reading file
  ANALYZING = 'ANALYZING', // Sending to Gemini
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface VideoItem {
  id: string;
  file: File;
  previewUrl: string;
  status: AnalysisStatus;
  resultText: string;
  error?: string;
}

export interface GenerateConfig {
  stylePrompt: string;
}