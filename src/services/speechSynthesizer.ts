export class SpeechSynthesizerService {
  private static instance: SpeechSynthesizerService;
  private voices: SpeechSynthesisVoice[] = [];

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
  }

  public speak(
    text: string,
    lang: 'ko-KR' | 'en-US' = 'ko-KR',
    rate: number = 1.0,
    onEnd?: () => void
  ): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
    if (!text.trim()) return false;

    // 기존 재생 취소
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = Math.max(0.5, Math.min(2.0, rate));
    utterance.pitch = 1.0;

    // 해당 언어에 적합한 보이스 선택
    const matchingVoices = this.voices.filter((v) => v.lang.startsWith(lang.slice(0, 2)));
    if (matchingVoices.length > 0) {
      const preferred = matchingVoices.find((v) => v.name.includes('Natural') || v.name.includes('Google')) || matchingVoices[0];
      utterance.voice = preferred;
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
