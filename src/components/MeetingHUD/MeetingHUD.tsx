import React, { useState } from 'react';
import { Mic, MicOff, Maximize2, Volume2, Sparkles, Sliders, ArrowDownCircle } from 'lucide-react';
import { TranslationRecord, TranslationEngine, SupportedLang, TargetLang } from '../../types';
import './MeetingHUD.css';

interface MeetingHUDProps {
  currentEnglish: string;
  interimEnglish: string;
  currentKorean: string;
  recentRecords: TranslationRecord[];
  isListening: boolean;
  engine: TranslationEngine;
  sourceLang: SupportedLang;
  targetLang: TargetLang;
  onToggleMic: () => void;
  onExitHUD: () => void;
  onSpeak: (text: string) => void;
}

export const MeetingHUD: React.FC<MeetingHUDProps> = ({
  currentEnglish,
  interimEnglish,
  currentKorean,
  recentRecords,
  isListening,
  engine,
  sourceLang,
  targetLang,
  onToggleMic,
  onExitHUD,
  onSpeak,
}) => {
  const [opacity, setOpacity] = useState(90);
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [showRecent, setShowRecent] = useState(true);

  // 최근 3개 문장만 상단에 롤링 표시
  const latestRecords = recentRecords.slice(0, 3).reverse();

  return (
    <div
      className={`meeting-hud-overlay font-${fontSize}`}
      style={{ backgroundColor: `rgba(10, 15, 29, ${opacity / 100})` }}
    >
      {/* Top HUD Controls */}
      <div className="hud-top-bar">
        <div className="hud-status-group">
          <button
            type="button"
            className={`hud-mic-btn ${isListening ? 'active' : ''}`}
            onClick={onToggleMic}
            title={isListening ? '음성 감지 중지' : '음성 감지 시작'}
          >
            {isListening ? <Mic size={14} className="hud-pulse" /> : <MicOff size={14} />}
            <span>{isListening ? '회의 듣는 중' : '마이크 일시정지'}</span>
          </button>

          <span className="hud-engine-tag">
            {engine === 'gemini' ? (
              <>
                <Sparkles size={11} /> Gemini 실시간 번역
              </>
            ) : (
              '기본 번역'
            )}
          </span>
        </div>

        {/* HUD Quick Settings */}
        <div className="hud-controls-group">
          <div className="hud-control-item" title="자막 배경 투명도 조절">
            <Sliders size={13} />
            <input
              type="range"
              min="40"
              max="98"
              value={opacity}
              onChange={(e) => setOpacity(parseInt(e.target.value, 10))}
              className="hud-opacity-slider"
            />
            <span className="hud-slider-val">{opacity}%</span>
          </div>

          <div className="hud-font-toggle">
            <button
              type="button"
              className={fontSize === 'sm' ? 'active' : ''}
              onClick={() => setFontSize('sm')}
            >
              작게
            </button>
            <button
              type="button"
              className={fontSize === 'md' ? 'active' : ''}
              onClick={() => setFontSize('md')}
            >
              보통
            </button>
            <button
              type="button"
              className={fontSize === 'lg' ? 'active' : ''}
              onClick={() => setFontSize('lg')}
            >
              크게
            </button>
          </div>

          <button
            type="button"
            className={`hud-btn ${showRecent ? 'active' : ''}`}
            onClick={() => setShowRecent(!showRecent)}
            title="이전 대화 롤링 자막 표시 토글"
          >
            <ArrowDownCircle size={14} />
            <span>이전 대화</span>
          </button>

          <button
            type="button"
            className="hud-btn exit-btn"
            onClick={onExitHUD}
            title="워크스페이스 전체 모드로 복귀"
          >
            <Maximize2 size={14} />
            <span>전체 화면</span>
          </button>
        </div>
      </div>

      {/* Main Subtitle Display Area */}
      <div className="hud-content-area">
        {/* Rolling previous subtitles */}
        {showRecent && latestRecords.length > 0 && (
          <div className="hud-previous-feed">
            {latestRecords.map((r) => (
              <div key={r.id} className="hud-feed-item">
                <span className="hud-feed-en">{r.sourceText}</span>
                <span className="hud-feed-ko">{r.translatedText}</span>
              </div>
            ))}
          </div>
        )}

        {/* Current Active Subtitle (Highlighted) */}
        <div className="hud-current-box">
          <div className="hud-source-line">
            <span className="hud-lang-label">{sourceLang === 'auto' ? 'AUTO' : sourceLang.toUpperCase()}</span>
            <p className="hud-source-text">
              {currentEnglish}
              {interimEnglish && <span className="hud-interim"> {interimEnglish}</span>}
              {!currentEnglish && !interimEnglish && (
                <span className="hud-placeholder">
                  {isListening ? '실시간 음성이 감지되면 여기에 자막이 시작됩니다...' : '마이크를 켜면 실시간 자막이 시작됩니다.'}
                </span>
              )}
            </p>
          </div>

          <div className="hud-target-line">
            <span className="hud-lang-label ko">{targetLang.toUpperCase()}</span>
            <p className="hud-target-text">
              {currentKorean ? (
                currentKorean
              ) : (
                <span className="hud-placeholder">실시간 번역 자막이 여기에 표시됩니다.</span>
              )}
            </p>
            {currentKorean && (
              <button
                type="button"
                className="hud-tts-btn"
                onClick={() => onSpeak(currentKorean)}
                title="한글 발음 듣기"
              >
                <Volume2 size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
