import React from 'react';
import { Mic, MicOff, Trash2, Clipboard, Volume2 } from 'lucide-react';
import { AudioVisualizerCanvas } from './AudioVisualizerCanvas';
import { AudioVisualizerService } from '../../services/audioVisualizer';
import { QuickChips } from './QuickChips';

interface InputPanelProps {
  text: string;
  interimText: string;
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

  return (
    <div className="workspace-panel input-panel">
      {/* Panel Top bar */}
      <div className="panel-header">
        <div className="panel-header-left">
          <span className="lang-tag en">ENGLISH</span>
          <span className="panel-title">원문 입력</span>
        </div>

        {/* Mic Control button */}
        <div className="mic-control-wrapper">
          <button
            type="button"
            className={`mic-toggle-btn ${isListening ? 'active' : ''}`}
            onClick={onToggleMic}
            title={isListening ? '마이크 끄기' : '마이크 켜기 (실시간 영어 음성 인식)'}
          >
            {isListening ? <Mic size={20} className="mic-spin" /> : <MicOff size={20} />}
            <span className="mic-btn-text">{isListening ? '마이크 끄기' : '마이크 켜기'}</span>
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
          placeholder="마이크를 켜고 영어로 말씀하시거나, 여기에 직접 영문 텍스트를 입력/붙여넣기 하세요..."
          value={displayText}
          onChange={(e) => onTextChange(e.target.value)}
          rows={6}
          spellCheck={false}
        />
        {interimText && (
          <div className="interim-floating-pill">
            <Volume2 size={12} className="interim-icon" />
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
            title="클립보드에서 영문 붙여넣기"
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
      <QuickChips onSelectPrompt={onSelectPrompt} />
    </div>
  );
};
