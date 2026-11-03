import React from 'react';
import { Mic, MicOff, Trash2, Clipboard, Volume2 } from 'lucide-react';
import { AudioVisualizerCanvas } from './AudioVisualizerCanvas';
import { AudioVisualizerService } from '../../services/audioVisualizer';
import { QuickChips } from './QuickChips';
import { SupportedLang, TargetLang } from '../../types';

interface InputPanelProps {
  text: string;
  interimText: string;
  sourceLang: SupportedLang;
  targetLang?: TargetLang;
  isListening: boolean;
  volume: number;
  visualizerService: AudioVisualizerService;
  onVolumeChange?: (volume: number) => void;
  onTextChange: (newText: string) => void;
  onToggleMic: () => void;
  onClearText: () => void;
  onSelectPrompt: (promptText: string) => void;
  onPasteClipboard: () => void;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  text,
  interimText,
  sourceLang,
  isListening,
  volume,
  visualizerService,
  onVolumeChange,
  onTextChange,
  onToggleMic,
  onClearText,
  onSelectPrompt,
  onPasteClipboard,
}) => {
  const displayText = interimText ? (text ? `${text} ${interimText}` : interimText) : text;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  const getLangBadge = () => {
    if (sourceLang === 'ko') return { text: '한국어 (KO)', class: 'ko' };
    if (sourceLang === 'en') return { text: '영어 (EN)', class: 'en' };
    return { text: '자동 감지 (AUTO)', class: 'auto' };
  };

  const getPlaceholder = () => {
    if (sourceLang === 'ko') {
      return '마이크를 켜고 한국어로 말씀하시거나, 여기에 한국어 텍스트를 입력/붙여넣기 하세요...';
    }
    if (sourceLang === 'en') {
      return '마이크를 켜고 영어로 말씀하시거나, 여기에 영문 텍스트를 입력/붙여넣기 하세요...';
    }
    return '영어 또는 한국어로 말씀하시거나 텍스트를 입력하세요 (언어가 자동으로 감지됩니다)...';
  };

  const badge = getLangBadge();

  return (
    <div className="workspace-panel input-panel">
      {/* Panel Top bar */}
      <div className="panel-header">
        <div className="panel-header-left">
          <span className={`lang-tag ${badge.class}`}>{badge.text}</span>
          <span className="panel-title">원문 입력</span>
        </div>

        {/* Mic Control button */}
        <div className="mic-control-wrapper">
          <button
            type="button"
            className={`mic-toggle-btn ${isListening ? 'active' : ''}`}
            onClick={onToggleMic}
            title={isListening ? '마이크 끄기' : '마이크 켜기 (실시간 음성 인식)'}
          >
            {isListening ? <Mic size={20} className="mic-spin" /> : <MicOff size={20} />}
            <span className="mic-btn-text">
              {isListening ? '음성 듣는 중' : `${sourceLang === 'ko' ? '한국어' : '영어'} 마이크 켜기`}
            </span>
          </button>
        </div>
      </div>

      {/* Audio Visualizer strip */}
      <div className="visualizer-container">
        <AudioVisualizerCanvas
          visualizerService={visualizerService}
          isListening={isListening}
          volume={volume}
          onVolumeChange={onVolumeChange}
        />
      </div>

      {/* Text Area with Live recognition feedback */}
      <div className="textarea-wrapper">
        <textarea
          className="text-input"
          placeholder={getPlaceholder()}
          value={displayText}
          onChange={(e) => onTextChange(e.target.value)}
          spellCheck={false}
        />
        {interimText && (
          <div className="interim-floating-pill">
            <Volume2 size={13} className="interim-icon" />
            <span>음성 실시간 감지 중...</span>
          </div>
        )}
      </div>

      {/* Action bottom toolbar */}
      <div className="panel-footer">
        <div className="counter-group">
          <span className="stat-pill">{charCount}자</span>
          <span className="stat-pill">{wordCount}단어</span>
        </div>

        <div className="action-buttons-group">
          <button
            type="button"
            className="panel-action-btn"
            onClick={onPasteClipboard}
            title="클립보드에서 텍스트 붙여넣기"
          >
            <Clipboard size={15} />
            <span>붙여넣기</span>
          </button>

          <button
            type="button"
            className="panel-action-btn danger"
            onClick={onClearText}
            disabled={!text && !interimText}
            title="입력 내용 지우기"
          >
            <Trash2 size={15} />
            <span>비우기</span>
          </button>
        </div>
      </div>

      {/* Quick sample chips */}
      <QuickChips sourceLang={sourceLang} onSelectPrompt={onSelectPrompt} />
    </div>
  );
};
