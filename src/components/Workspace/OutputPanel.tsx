import React, { useState } from 'react';
import { Volume2, VolumeX, Copy, Check, Clock, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { TranslationStatus, TranslationEngine, TranslationTone } from '../../types';

interface OutputPanelProps {
  translatedText: string;
  status: TranslationStatus;
  engine: TranslationEngine;
  tone: TranslationTone;
  latencyMs: number;
  errorMessage: string | null;
  onSpeak: (text: string) => void;
  onStopSpeak: () => void;
  isSpeaking: boolean;
  onRetry: () => void;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({
  translatedText,
  status,
  engine,
  tone,
  latencyMs,
  errorMessage,
  onSpeak,
  onStopSpeak,
  isSpeaking,
  onRetry,
}) => {
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'huge'>('large');

  const handleCopy = async () => {
    if (!translatedText) return;
    try {
      await navigator.clipboard.writeText(translatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      //
    }
  };

  const getToneLabel = (t: TranslationTone) => {
    switch (t) {
      case 'polite':
        return '정중한 존댓말';
      case 'casual':
        return '친근한 반말';
      case 'formal':
        return '격식 보고체';
      case 'natural':
      default:
        return '자연스러운 표준';
    }
  };

  return (
    <div className="workspace-panel output-panel">
      {/* Panel Top bar */}
      <div className="panel-header">
        <div className="panel-header-left">
          <span className="lang-tag ko">KOREAN</span>
          <span className="panel-title">실시간 한국어 번역</span>
        </div>

        {/* Translation Meta & Font controls */}
        <div className="panel-meta-group">
          {latencyMs > 0 && status !== 'translating' && (
            <span className="latency-badge" title="번역 소요 시간">
              <Clock size={12} />
              <span>{latencyMs}ms</span>
            </span>
          )}

          {engine === 'gemini' && (
            <span className="tone-badge" title={`적용된 어조: ${getToneLabel(tone)}`}>
              <Sparkles size={12} />
              <span>{getToneLabel(tone)}</span>
            </span>
          )}

          {/* Font size toggler */}
          <div className="font-size-group">
            <button
              type="button"
              className={`font-size-btn ${fontSize === 'normal' ? 'active' : ''}`}
              onClick={() => setFontSize('normal')}
              title="보통 크기 (26px)"
            >
              보통
            </button>
            <button
              type="button"
              className={`font-size-btn ${fontSize === 'large' ? 'active' : ''}`}
              onClick={() => setFontSize('large')}
              title="크게 (34px - 권장)"
            >
              크게
            </button>
            <button
              type="button"
              className={`font-size-btn ${fontSize === 'huge' ? 'active' : ''}`}
              onClick={() => setFontSize('huge')}
              title="초대형 (44px - 원거리용)"
            >
              초대형
            </button>
          </div>
        </div>
      </div>

      {/* Main Translation Content Area */}
      <div className="output-body">
        {status === 'translating' && !translatedText && (
          <div className="translating-indicator">
            <div className="spinner-orbit"></div>
            <p className="loading-text">실시간 번역을 생성하는 중...</p>
          </div>
        )}

        {errorMessage ? (
          <div className="error-card">
            <AlertCircle size={22} className="error-icon" />
            <div className="error-text-wrap">
              <span className="error-title">번역 오류</span>
              <p className="error-desc">{errorMessage}</p>
            </div>
            <button type="button" className="retry-btn" onClick={onRetry}>
              <RefreshCw size={14} />
              <span>재시도</span>
            </button>
          </div>
        ) : (
          <div className={`translated-text-display font-${fontSize}`}>
            {translatedText ? (
              <p className="korean-text">{translatedText}</p>
            ) : (
              <p className="placeholder-text">
                영어로 말씀하시거나 텍스트를 입력하시면 여기에 자연스러운 한국어 번역이 즉시 나타납니다.
              </p>
            )}
            {status === 'translating' && translatedText && (
              <span className="typing-cursor"></span>
            )}
          </div>
        )}
      </div>

      {/* Panel Action Footer */}
      <div className="panel-footer">
        <div className="engine-source-info">
          <span className="engine-label">엔진:</span>
          <span className="engine-name">
            {engine === 'gemini' ? 'Gemini AI (High Quality)' : '무료 스트리밍 번역'}
          </span>
        </div>

        <div className="action-buttons-group">
          {/* TTS Speaker button */}
          <button
            type="button"
            className={`panel-action-btn ${isSpeaking ? 'active pulse' : ''}`}
            onClick={() => (isSpeaking ? onStopSpeak() : onSpeak(translatedText))}
            disabled={!translatedText}
            title={isSpeaking ? '음성 재생 중지' : '한국어 음성으로 듣기 (TTS)'}
          >
            {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
            <span>{isSpeaking ? '정지' : '듣기'}</span>
          </button>

          {/* Copy button */}
          <button
            type="button"
            className={`panel-action-btn ${copied ? 'success' : ''}`}
            onClick={handleCopy}
            disabled={!translatedText}
            title="한국어 번역 결과 복사"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? '복사됨!' : '복사'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
