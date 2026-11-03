import { AppSettings, TranslationRecord } from '../types';

const SETTINGS_KEY = 'livelingua_settings_v1';
const HISTORY_KEY = 'livelingua_history_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  engine: 'free',
  geminiApiKey: '',
  geminiModel: 'gemini-1.5-flash',
  tone: 'natural',
  autoTts: false,
  ttsVoiceRate: 1.0,
  continuousListening: true,
  debounceMs: 500,
  defaultViewMode: 'normal',
};

export const StorageService = {
  getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (data) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
    } catch {
      // 파싱 실패 시 기본값 반환
    }
    return DEFAULT_SETTINGS;
  },

  saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // 로컬스토리지 용량 초과 등 무시
    }
  },

  getHistory(): TranslationRecord[] {
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      //
    }
    return [];
  },

  saveHistory(records: TranslationRecord[]): void {
    try {
      // 최대 100개 유지
      const trimmed = records.slice(0, 100);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
    } catch {
      //
    }
  },

  exportAsFile(records: TranslationRecord[], format: 'txt' | 'json') {
    let content = '';
    let mimeType = 'text/plain';
    let ext = 'txt';

    if (format === 'json') {
      content = JSON.stringify(records, null, 2);
      mimeType = 'application/json';
      ext = 'json';
    } else {
      content = records
        .map((r) => {
          const time = new Date(r.timestamp).toLocaleString('ko-KR');
          return `[${time}] [${r.sourceType.toUpperCase()} | ${r.engine}]\nEN: ${r.sourceText}\nKO: ${r.translatedText}\n`;
        })
        .join('\n----------------------------------------\n\n');
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LiveLingua_History_${new Date().toISOString().slice(0, 10)}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
