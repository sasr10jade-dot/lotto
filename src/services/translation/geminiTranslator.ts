import { GoogleGenerativeAI } from '@google/generative-ai';
import { TranslationTone } from '../../types';
import { ITranslationService, TranslationResult } from './types';

export class GeminiTranslatorService implements ITranslationService {
  public name = 'Gemini AI 실시간 번역';
  public engine = 'gemini' as const;
  private apiKey: string;
  private modelName: string;

  constructor(apiKey: string, modelName: string = 'gemini-1.5-flash') {
    this.apiKey = apiKey.trim();
    this.modelName = modelName;
  }

  private getToneInstruction(tone: TranslationTone = 'natural', isKoToEn: boolean): string {
    if (isKoToEn) {
      switch (tone) {
        case 'formal':
          return 'Translate into professional business English suitable for executive meetings and formal presentations.';
        case 'casual':
          return 'Translate into relaxed, friendly everyday conversational English.';
        case 'polite':
        case 'natural':
        default:
          return 'Translate into natural, clear, idiomatic conversational English as spoken by native speakers in professional meetings.';
      }
    } else {
      switch (tone) {
        case 'polite':
          return '상대방을 존중하는 정중하고 예의 바른 존댓말(해요체/하십시오체)로 번역하세요.';
        case 'casual':
          return '친구끼리 대화하듯 편안하고 자연스러운 반말 구어체로 번역하세요.';
        case 'formal':
          return '격식 있는 비즈니스 및 공식 문서/보고체(하십시오체)로 번역하세요.';
        case 'natural':
        default:
          return '어색한 직역이나 번역투를 완전히 배제하고, 실제 한국인이 일상 및 비즈니스 회의에서 사용하는 가장 자연스러운 한국어로 번역하세요.';
      }
    }
  }

  public async translate(
    text: string,
    sourceLang: string = 'auto',
    targetLang: string = 'ko',
    tone: TranslationTone = 'natural'
  ): Promise<TranslationResult> {
    const trimmed = text.trim();
    if (!trimmed) {
      return { translatedText: '', engine: 'gemini', latencyMs: 0 };
    }

    if (!this.apiKey) {
      throw new Error('Gemini API 키가 설정되지 않았습니다. 우측 상단 [설정]에서 API Key를 입력해 주세요.');
    }

    const isKoToEn = targetLang === 'en' || (sourceLang === 'auto' && /[가-힣]/.test(trimmed));
    const toneGuide = this.getToneInstruction(tone, isKoToEn);
    const startTime = performance.now();

    try {
      const genAI = new GoogleGenerativeAI(this.apiKey);
      const model = genAI.getGenerativeModel({
        model: this.modelName || 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.25, // 문맥의 자연스러움과 일관성의 최적 균형
        },
      });

      const prompt = `You are a world-class real-time bilingual translator between English and Korean for video conferences and business collaboration.
Translation Direction: ${isKoToEn ? 'Korean to English' : 'English to Korean'}
Style Guide: ${toneGuide}

Strict Rules:
1. Translate faithfully and idiomatically. Avoid rigid word-for-word translation.
2. Output ONLY the translated text.
3. Absolutely NO explanations, no romanization, no formatting tags, no markdown codeblocks, no surrounding quotation marks.

Original text:
${trimmed}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let translatedText = response.text().trim();

      // 따옴표나 불필요한 줄바꿈 정돈
      if (translatedText.startsWith('"') && translatedText.endsWith('"')) {
        translatedText = translatedText.slice(1, -1);
      }

      const latencyMs = Math.round(performance.now() - startTime);

      return {
        translatedText,
        engine: 'gemini',
        latencyMs,
      };
    } catch (err: any) {
      const msg = err.message || String(err);
      if (msg.includes('API_KEY_INVALID') || msg.includes('403') || msg.includes('400')) {
        throw new Error('유효하지 않은 Gemini API 키입니다. 설정에서 키를 확인해 주세요.');
      }
      throw new Error(`Gemini 번역 실패: ${msg}`);
    }
  }
}
