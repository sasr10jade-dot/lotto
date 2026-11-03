import { AppSettings, TranslationTone } from '../../types';
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
    overrideTone?: TranslationTone
  ): Promise<TranslationResult> {
    const tone = overrideTone || settings.tone;
    const service = this.getService(settings);

    try {
      return await service.translate(text, tone);
    } catch (err: any) {
      // Gemini 모드였는데 실패한 경우 무료 모드로 graceful fallback 시도
      if (settings.engine === 'gemini') {
        try {
          const fallback = await this.freeService.translate(text);
          return {
            ...fallback,
            // Fallback 표시를 위해 유지
          };
        } catch {
          // Fallback도 실패하면 원래 에러 throw
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
