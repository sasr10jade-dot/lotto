import { AppSettings, SupportedLang, TargetLang, TranslationTone } from '../../types';
import { FreeTranslatorService } from './freeTranslator';
import { GeminiTranslatorService } from './geminiTranslator';
import { ITranslationService, TranslationResult } from './types';

export class TranslationManager {
  private freeService = new FreeTranslatorService();

  public getService(settings: AppSettings): ITranslationService {
    if (settings.engine === 'gemini' && settings.geminiApiKey.trim()) {
      return new GeminiTranslatorService(settings.geminiApiKey, settings.geminiModel);
    }
    return this.freeService;
  }

  public async translate(
    text: string,
    settings: AppSettings,
    sourceLang: SupportedLang = 'auto',
    targetLang: TargetLang = 'ko',
    overrideTone?: TranslationTone
  ): Promise<TranslationResult> {
    const tone = overrideTone || settings.tone;
    const service = this.getService(settings);

    try {
      return await service.translate(text, sourceLang, targetLang, tone);
    } catch (err: any) {
      // Gemini 모드였는데 실패한 경우 무료 모드로 graceful fallback 시도
      if (settings.engine === 'gemini') {
        try {
          const fallback = await this.freeService.translate(text, sourceLang, targetLang);
          return fallback;
        } catch {
          // Fallback도 실패 시 원래 에러 throw
        }
      }
      throw err;
    }
  }
}

export const translationManager = new TranslationManager();
export * from './types';
export * from './freeTranslator';
export * from './geminiTranslator';
