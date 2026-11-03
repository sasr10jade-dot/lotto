export type TranslationEngine = 'free' | 'gemini';
export type TranslationTone = 'natural' | 'polite' | 'casual' | 'formal';
export type InputMode = 'mic' | 'text';
export type TranslationStatus = 'idle' | 'translating' | 'success' | 'error';
export type SupportedLang = 'en' | 'ko' | 'auto';
export type TargetLang = 'en' | 'ko';
export type ViewMode = 'normal' | 'wide' | 'hud';

export interface TranslationRecord {
  id: string;
  timestamp: number;
  sourceText: string;
  translatedText: string;
  sourceLang: SupportedLang;
  targetLang: TargetLang;
  sourceType: InputMode;
  engine: TranslationEngine;
  tone: TranslationTone;
  latencyMs: number;
  isFavorite: boolean;
}

export interface AppSettings {
  engine: TranslationEngine;
  geminiApiKey: string;
  geminiModel: string;
  tone: TranslationTone;
  autoTts: boolean;
  ttsVoiceRate: number; // 0.8 ~ 1.4
  continuousListening: boolean;
  debounceMs: number; // 텍스트 입력 번역 디바운스
  defaultViewMode: ViewMode;
}

export interface AudioVisualizerState {
  isListening: boolean;
  volume: number; // 0 - 100
  error: string | null;
}

export interface QuickPrompt {
  id: string;
  category: 'daily' | 'business' | 'tech';
  text: string;
  label: string;
  lang: 'en' | 'ko';
}
