import { TranslationEngine, TranslationTone } from '../../types';

export interface TranslationResult {
  translatedText: string;
  engine: TranslationEngine;
  latencyMs: number;
}

export interface ITranslationService {
  name: string;
  engine: TranslationEngine;
  translate(text: string, tone?: TranslationTone): Promise<TranslationResult>;
}
