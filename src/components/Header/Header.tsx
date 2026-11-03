import React, { useState, useEffect } from 'react';
import { Languages, Mic, MicOff, Settings, History, Sparkles, Tv, Headphones, Maximize, Minimize } from 'lucide-react';
import { AppSettings } from '../../types';
import './Header.css';

interface HeaderProps {
  settings: AppSettings;
  isListening: boolean;
  historyCount: number;
  showHistory: boolean;
  isHUDMode: boolean;
  onToggleHUD: () => void;
  onToggleHistory: () => void;
  onOpenSettings: () => void;
  onOpenAudioGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  isListening,
  historyCount,
  showHistory,
  isHUDMode,
  onToggleHUD,
  onToggleHistory,
  onOpenSettings,
  onOpenAudioGuide,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      //
    }
  };

  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-icon-wrapper">
          <Languages className="brand-icon" size={24} />
          <span className="brand-dot"></span>
        </div>
        <div className="brand-text">
          <div className="brand-title-row">
            <h1 className="brand-title">LiveLingua KR</h1>
            <span className="brand-tag">MEETING PRO</span>
          </div>
          <p className="brand-subtitle">화상 회의 실시간 영어-한국어 자막 번역기</p>
        </div>
      </div>

      <div className="header-status-group">
        {/* Fullscreen Button */}
        <button
          type="button"
          className={`header-btn fullscreen-btn ${isFullscreen ? 'active' : ''}`}
          onClick={toggleFullscreen}
          title={isFullscreen ? '전체 화면 해제 (ESC)' : '화면 모니터 전체로 키우기'}
        >
          {isFullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
          <span className="btn-label">{isFullscreen ? '화면 줄이기' : '화면 키우기'}</span>
        </button>

        {/* HUD Mode Button */}
        <button
          type="button"
          className={`header-btn hud-mode-btn ${isHUDMode ? 'active' : ''}`}
          onClick={onToggleHUD}
          title="회의용 플로팅 자막 HUD 모드로 전환"
        >
          <Tv size={17} />
          <span className="btn-label">자막 HUD 모드</span>
        </button>

        {/* Audio Guide Button */}
        <button
          type="button"
          className="header-btn guide-btn"
          onClick={onOpenAudioGuide}
          title="화상 회의 상대방 목소리 캡처(스테레오 믹스) 가이드"
        >
          <Headphones size={17} />
          <span className="btn-label">회의 오디오 연결법</span>
        </button>

        {/* Engine status badge */}
        <div className={`engine-badge ${settings.engine === 'gemini' ? 'gemini' : 'free'}`}>
          {settings.engine === 'gemini' ? (
            <>
              <Sparkles size={14} className="sparkle-icon" />
              <span>Gemini Flash</span>
            </>
          ) : (
            <>
              <span className="status-dot"></span>
              <span>무료 기본 엔진</span>
            </>
          )}
        </div>

        {/* Mic status indicator */}
        <div className={`mic-status-pill ${isListening ? 'active' : ''}`}>
          {isListening ? (
            <>
              <Mic size={14} className="mic-pulse-icon" />
              <span>실시간 인식 중</span>
            </>
          ) : (
            <>
              <MicOff size={14} />
              <span>마이크 대기</span>
            </>
          )}
        </div>

        {/* History toggle button */}
        <button
          className={`header-btn ${showHistory ? 'active' : ''}`}
          onClick={onToggleHistory}
          title="번역 기록 보기/숨기기"
        >
          <History size={18} />
          <span className="btn-label">기록</span>
          {historyCount > 0 && <span className="counter-badge">{historyCount}</span>}
        </button>

        {/* Settings button */}
        <button
          className="header-btn settings-btn"
          onClick={onOpenSettings}
          title="환경 설정 (API 키, 번역 어조 등)"
        >
          <Settings size={18} />
          <span className="btn-label">설정</span>
        </button>
      </div>
    </header>
  );
};
