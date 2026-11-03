export class SpeechSynthesizerService {
  private static instance: SpeechSynthesizerService;
  private voices: SpeechSynthesisVoice[] = [];
  private selectedVoice: SpeechSynthesisVoice | null = null;

  private constructor() {
    this.loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        this.loadVoices();
      };
    }
  }

  public static getInstance(): SpeechSynthesizerService {
    if (!SpeechSynthesizerService.instance) {
      SpeechSynthesizerService.instance = new SpeechSynthesizerService();
    }
    return SpeechSynthesizerService.instance;
  }

  private loadVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    this.voices = window.speechSynthesis.getVoices();
    // 한국어 보이스 우선 선택 (Google 한국의, Yuna, Microsoft Heami 등)
    const koreanVoices = this.voices.filter((v) => v.lang.startsWith('ko'));
    if (koreanVoices.length > 0) {
      this.selectedVoice = koreanVoices.find((v) => v.name.includes('Natural') || v.name.includes('Google')) || koreanVoices[0];
    }
  }

  public speak(text: string, rate: number = 1.0, onEnd?: () => void): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
    if (!text.trim()) return false;

    // 기존 재생 취소
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = Math.max(0.5, Math.min(2.0, rate));
    utterance.pitch = 1.0;

    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    } else {
      this.loadVoices();
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }
    }

    if (onEnd) {
      utterance.onend = () => onEnd();
      utterance.onerror = () => onEnd();
    }

    window.speechSynthesis.speak(utterance);
    return true;
  }

  public stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public isSpeaking(): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
    return window.speechSynthesis.speaking;
  }
}
