import React from 'react';
import { InputPanel } from './InputPanel';
import { OutputPanel } from './OutputPanel';
import { AudioVisualizerService } from '../../services/audioVisualizer';
import { SupportedLang, TargetLang, TranslationEngine, TranslationStatus, TranslationTone, ViewMode } from '../../types';
import './Workspace.css';

interface DualWorkspaceProps {
  // Lang props
  sourceLang: SupportedLang;
  targetLang: TargetLang;
  viewMode: ViewMode;

  // Input props
  sourceText: string;
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

  // Output props
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

export const DualWorkspace: React.FC<DualWorkspaceProps> = ({
  sourceLang,
  targetLang,
  viewMode,
  sourceText,
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
  return (
    <div className={`workspace-container mode-${viewMode}`}>
      <div className="workspace-grid">
        {/* Left Input Panel */}
        <InputPanel
          text={sourceText}
          interimText={interimText}
          sourceLang={sourceLang}
          targetLang={targetLang}
          isListening={isListening}
          volume={volume}
          visualizerService={visualizerService}
          onVolumeChange={onVolumeChange}
          onTextChange={onTextChange}
          onToggleMic={onToggleMic}
          onClearText={onClearText}
          onSelectPrompt={onSelectPrompt}
          onPasteClipboard={onPasteClipboard}
        />

        {/* Right Output Panel */}
        <OutputPanel
          translatedText={translatedText}
          targetLang={targetLang}
          status={status}
          engine={engine}
          tone={tone}
          latencyMs={latencyMs}
          errorMessage={errorMessage}
          onSpeak={onSpeak}
          onStopSpeak={onStopSpeak}
          isSpeaking={isSpeaking}
          onRetry={onRetry}
        />
      </div>
    </div>
  );
};
