import React, { useState } from 'react';
import { X, Sparkles, Key, Check, AlertCircle, Eye, EyeOff, Save, Volume2, Sliders } from 'lucide-react';
import { AppSettings, TranslationEngine, TranslationTone } from '../../types';
import { GeminiTranslatorService } from '../../services/translation/geminiTranslator';
import './SettingsModal.css';

interface SettingsModalProps {
  settings: AppSettings;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  isOpen,
  onClose,
  onSave,
}) => {
  const [engine, setEngine] = useState<TranslationEngine>(settings.engine);
  const [apiKey, setApiKey] = useState(settings.geminiApiKey);
  const [model, setModel] = useState(settings.geminiModel || 'gemini-1.5-flash');
  const [tone, setTone] = useState<TranslationTone>(settings.tone);
  const [autoTts, setAutoTts] = useState(settings.autoTts);
  const [ttsVoiceRate, setTtsVoiceRate] = useState(settings.ttsVoiceRate || 1.0);
  const [showKey, setShowKey] = useState(false);

  // API key connection testing state
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTestApiKey = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: 'API 키를 먼저 입력해 주세요.' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const tester = new GeminiTranslatorService(apiKey, model);
      const res = await tester.translate('Hello world');
      if (res.translatedText) {
        setTestResult({
          success: true,
          message: `연결 성공! (응답: "${res.translatedText}", ${res.latencyMs}ms)`,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'API 키 검증에 실패했습니다.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...settings,
      engine,
      geminiApiKey: apiKey.trim(),
      geminiModel: model,
      tone,
      autoTts,
      ttsVoiceRate,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <Sliders size={20} className="modal-icon" />
            <h3 className="modal-title">환경 설정</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-body">
            {/* 1. Translation Engine Choice */}
            <div className="setting-section">
              <label className="section-label">번역 엔진 선택</label>
              <div className="engine-radio-grid">
                <div
                  className={`engine-card-option ${engine === 'free' ? 'selected' : ''}`}
                  onClick={() => setEngine('free')}
                >
                  <div className="engine-card-top">
                    <span className="engine-title">무료 기본 엔진</span>
                    {engine === 'free' && <Check size={16} className="selected-check" />}
                  </div>
                  <p className="engine-desc">
                    별도 키 입력 없이 즉시 사용 가능한 빠른 기본 번역
                  </p>
                </div>

                <div
                  className={`engine-card-option ${engine === 'gemini' ? 'selected' : ''}`}
                  onClick={() => setEngine('gemini')}
                >
                  <div className="engine-card-top">
                    <span className="engine-title gemini-title">
                      <Sparkles size={14} /> Gemini AI 엔진
                    </span>
                    {engine === 'gemini' && <Check size={16} className="selected-check" />}
                  </div>
                  <p className="engine-desc">
                    자연스러운 한국어 구어체 및 어조(존댓말/격식) 완벽 제어
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Gemini Settings (Shown or highlighted) */}
            {engine === 'gemini' && (
              <div className="setting-section gemini-settings-box">
                <label className="section-label">
                  <Key size={14} />
                  <span>Gemini API 키 설정</span>
                </label>
                <div className="input-with-actions">
                  <input
                    type={showKey ? 'text' : 'password'}
                    placeholder="AIzaSy... (Google AI Studio API Key)"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="api-key-input"
                  />
                  <button
                    type="button"
                    className="icon-action-btn"
                    onClick={() => setShowKey(!showKey)}
                    title={showKey ? '키 숨기기' : '키 보기'}
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    type="button"
                    className="test-key-btn"
                    onClick={handleTestApiKey}
                    disabled={testing || !apiKey}
                  >
                    {testing ? '검증 중...' : '연결 테스트'}
                  </button>
                </div>

                {testResult && (
                  <div className={`test-feedback ${testResult.success ? 'success' : 'error'}`}>
                    {testResult.success ? (
                      <Check size={14} />
                    ) : (
                      <AlertCircle size={14} />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}

                <div className="gemini-sub-row">
                  <div className="sub-field">
                    <label className="sub-label">모델 선택</label>
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="select-input"
                    >
                      <option value="gemini-1.5-flash">Gemini 1.5 Flash (권장: 초고속)</option>
                      <option value="gemini-2.0-flash">Gemini 2.0 Flash (최신 모델)</option>
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro (정밀 번역)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Tone of Translation */}
            <div className="setting-section">
              <label className="section-label">번역 어조 / 스타일</label>
              <div className="tone-grid">
                {[
                  { value: 'natural', label: '자연스러운 표준체', desc: '일상에서 가장 자연스러운 해요체' },
                  { value: 'polite', label: '정중한 존댓말', desc: '예의 바른 하십시오/해요체' },
                  { value: 'casual', label: '친근한 반말', desc: '친구와 대화하듯 편안한 어조' },
                  { value: 'formal', label: '격식 보고체', desc: '비즈니스 및 뉴스 발표체' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={`tone-card ${tone === item.value ? 'active' : ''}`}
                    onClick={() => setTone(item.value as TranslationTone)}
                  >
                    <span className="tone-label">{item.label}</span>
                    <span className="tone-desc">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Audio & TTS Settings */}
            <div className="setting-section">
              <label className="section-label">
                <Volume2 size={14} />
                <span>음성 및 음성 읽기(TTS) 옵션</span>
              </label>

              <div className="toggle-row">
                <div className="toggle-info">
                  <span className="toggle-title">번역 완료 시 자동 읽기 (Auto TTS)</span>
                  <span className="toggle-desc">새로운 문장 번역이 완료되면 자동으로 한국어 발음을 들려줍니다.</span>
                </div>
                <label className="switch-wrapper">
                  <input
                    type="checkbox"
                    checked={autoTts}
                    onChange={(e) => setAutoTts(e.target.checked)}
                  />
                  <span className="switch-slider"></span>
                </label>
              </div>

              <div className="slider-row">
                <div className="slider-label-group">
                  <span className="slider-label">한국어 음성 읽기 속도</span>
                  <span className="slider-value">{ttsVoiceRate.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.4"
                  step="0.1"
                  value={ttsVoiceRate}
                  onChange={(e) => setTtsVoiceRate(parseFloat(e.target.value))}
                  className="range-slider"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            <button type="button" className="modal-btn secondary" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="modal-btn primary">
              <Save size={16} />
              <span>설정 저장</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
