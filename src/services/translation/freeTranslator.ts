import { ITranslationService, TranslationResult } from './types';

export class FreeTranslatorService implements ITranslationService {
  public name = '무료 번역 (Default)';
  public engine = 'free' as const;

  public async translate(text: string): Promise<TranslationResult> {
    const trimmed = text.trim();
    if (!trimmed) {
      return { translatedText: '', engine: 'free', latencyMs: 0 };
    }

    const startTime = performance.now();

    // 1차 시도: Google GTx Web Translation endpoint (가장 빠르고 한국어 품질 우수)
    try {
      const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ko&dt=t&q=${encodeURIComponent(trimmed)}`;
      const res = await fetch(gtxUrl, {
        method: 'GET',
      });

      if (res.ok) {
        const data = await res.json();
        // data[0]은 각 문장별 번역 튜플 배열: [[ "번역1", "원문1", ...], [ "번역2", ...]]
        if (Array.isArray(data) && Array.isArray(data[0])) {
          const combined = data[0]
            .map((item: any) => (Array.isArray(item) ? item[0] : ''))
            .filter(Boolean)
            .join(' ');

          if (combined.trim()) {
            const latencyMs = Math.round(performance.now() - startTime);
            return {
              translatedText: combined.trim(),
              engine: 'free',
              latencyMs,
            };
          }
        }
      }
    } catch {
      // 1차 실패 시 2차 Fallback 진행
    }

    // 2차 Fallback 시도: MyMemory API
    try {
      const memoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=en|ko`;
      const res = await fetch(memoryUrl);
      if (res.ok) {
        const data = await res.json();
        if (data && data.responseData && data.responseData.translatedText) {
          const latencyMs = Math.round(performance.now() - startTime);
          return {
            translatedText: data.responseData.translatedText,
            engine: 'free',
            latencyMs,
          };
        }
      }
    } catch (err: any) {
      throw new Error('무료 번역 서버 연결 실패: ' + (err.message || String(err)));
    }

    throw new Error('번역 결과를 가져오지 못했습니다.');
  }
}
