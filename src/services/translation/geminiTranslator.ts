import { GoogleGenerativeAI } from '@google/generative-ai';
import { TranslationTone } from '../../types';
import { ITranslationService, TranslationResult } from './types';

export class GeminiTranslatorService implements ITranslationService {
  public name = 'Gemini AI 번역';
  public engine = 'gemini' as const;
  private apiKey: string;
  private modelName: string;

  constructor(apiKey: string, modelName: string = 'gemini-1.5-flash') {
    this.apiKey = apiKey.trim();
    this.modelName = modelName;
  }

  private getToneInstruction(tone: TranslationTone = 'natural'): string {
    switch (tone) {
      case 'polite':
        return '공손하고 정중한 존댓말(해요체/하십시오체)로 번역하세요.';
      case 'casual':
        return '친근하고 편안한 반말 대화체로 자연스럽게 번역하세요.';
      case 'formal':
        return '비즈니스 및 공식 문서에 적합한 격식 있는 보고체(하십시오체/명확한 어조)로 번역하세요.';
      case 'natural':
      default:
        return '실제 한국인이 일상에서 말하듯 가장 자연스럽고 매끄러운 표준 한국어로 번역하세요.';
    }
  }

  public async translate(text: string, tone: TranslationTone = 'natural'): Promise<TranslationResult> {
    const trimmed = text.trim();
    if (!trimmed) {
      return { translatedText: '', engine: 'gemini', latencyMs: 0 };
    }

    if (!this.apiKey) {
      throw new Error('Gemini API 키가 설정되지 않았습니다. 우측 상단 [설정]에서 API Key를 입력해 주세요.');
    }

    const startTime = performance.now();
    try {
      const genAI = new GoogleGenerativeAI(this.apiKey);
      const model = genAI.getGenerativeModel({
        model: this.modelName || 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.2, // 정확하고 일관된 번역을 위한 낮은 temperature
        },
      });

      const toneGuide = this.getToneInstruction(tone);
      const prompt = `System Instruction:
You are an expert English-to-Korean real-time translator.
Translate the following English speech/text into natural Korean.
Style guideline: ${toneGuide}
Important:
- Return ONLY the translated Korean text.
- Do NOT add quotes, markdown formatting, apologies, or explanatory notes.

English Source:
${trimmed}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const translatedText = response.text().trim();

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
