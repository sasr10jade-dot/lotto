import { ITranslationService, TranslationResult } from './types';

export class FreeTranslatorService implements ITranslationService {
  public name = '무료 고속 번역';
  public engine = 'free' as const;

  public async translate(
    text: string,
    sourceLang: string = 'auto',
    targetLang: string = 'ko'
  ): Promise<TranslationResult> {
    const trimmed = text.trim();
    if (!trimmed) {
      return { translatedText: '', engine: 'free', latencyMs: 0 };
    }

    const startTime = performance.now();
    const sl = sourceLang === 'auto' ? 'auto' : sourceLang;
    const tl = targetLang || (sl === 'ko' ? 'en' : 'ko');

    // 1차 시도: Google GTx Web Endpoint (실시간 스트리밍 번역에 가장 빠르고 정확)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(trimmed)}`;
      const res = await fetch(gtxUrl, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && Array.isArray(data[0])) {
          // 문장별로 번역된 조각들을 자연스럽게 병합
          const combined = data[0]
            .map((item: any) => (Array.isArray(item) ? item[0] : ''))
            .filter((piece: string) => typeof piece === 'string' && piece.trim().length > 0)
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
      // 1차 실패 시 2차 Fallback
    }

    // 2차 Fallback 시도: MyMemory API
    try {
      const fromLang = sl === 'auto' ? (/[가-힣]/.test(trimmed) ? 'ko' : 'en') : sl;
      const toLang = tl;
      const memoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=${fromLang}|${toLang}`;
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

    throw new Error('번역 결과를 가져오지 못했습니다. 네트워크 상태를 확인해 주세요.');
  }
}
