import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Header } from './components/Header/Header';
import { DualWorkspace } from './components/Workspace/DualWorkspace';
import { HistoryList } from './components/History/HistoryList';
import { SettingsModal } from './components/Settings/SettingsModal';
import { MeetingHUD } from './components/MeetingHUD/MeetingHUD';
import { AudioGuideModal } from './components/AudioGuide/AudioGuideModal';
import { SpeechRecognitionService } from './services/speechRecognition';
import { AudioVisualizerService } from './services/audioVisualizer';
import { SpeechSynthesizerService } from './services/speechSynthesizer';
import { translationManager } from './services/translation';
import { StorageService } from './services/storage';
import { AppSettings, TranslationRecord, TranslationStatus } from './types';
import './App.css';

export function App() {
  // Settings & History state
  const [settings, setSettings] = useState<AppSettings>(() => StorageService.getSettings());
  const [records, setRecords] = useState<TranslationRecord[]>(() => StorageService.getHistory());

  // Input & Output state
  const [sourceText, setSourceText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [status, setStatus] = useState<TranslationStatus>('idle');
  const [latencyMs, setLatencyMs] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio state
  const [isListening, setIsListening] = useState(false);
  const [volume, setVolume] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Modal / Drawer / Mode state
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAudioGuide, setShowAudioGuide] = useState(false);
  const [isHUDMode, setIsHUDMode] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Services instances
  const visualizerService = useMemo(() => new AudioVisualizerService(), []);
  const synthesizerService = useMemo(() => SpeechSynthesizerService.getInstance(), []);
  const recognitionRef = useRef<SpeechRecognitionService | null>(null);

  // Debounce timer for text typing
  const debounceTimerRef = useRef<any>(null);
  const lastTranslatedTextRef = useRef<string>('');

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast(null);
    }, 3000);
  }, []);

  // Save history on change
  useEffect(() => {
    StorageService.saveHistory(records);
  }, [records]);

  // Save settings on change
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
    showToast('설정이 성공적으로 저장되었습니다.');
  };

  // Translation Core Executor
  const executeTranslation = useCallback(
    async (text: string, sourceType: 'mic' | 'text' = 'text') => {
      const trimmed = text.trim();
      if (!trimmed) {
        setTranslatedText('');
        setStatus('idle');
        setErrorMessage(null);
        return;
      }

      // 동일한 텍스트 중복 번역 방지
      if (trimmed === lastTranslatedTextRef.current && status === 'success') {
        return;
      }

      setStatus('translating');
      setErrorMessage(null);

      try {
        const result = await translationManager.translate(trimmed, settings);
        lastTranslatedTextRef.current = trimmed;
        setTranslatedText(result.translatedText);
        setLatencyMs(result.latencyMs);
        setStatus('success');

        // 히스토리 기록 생성 (유의미한 길이인 경우)
        if (result.translatedText) {
          const newRecord: TranslationRecord = {
            id: `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            timestamp: Date.now(),
            sourceText: trimmed,
            translatedText: result.translatedText,
            sourceType,
            engine: result.engine,
            tone: settings.tone,
            latencyMs: result.latencyMs,
            isFavorite: false,
          };
          setRecords((prev) => [newRecord, ...prev.filter((r) => r.sourceText !== trimmed)]);
        }

        // Auto TTS 옵션이 켜져 있는 경우 자동 발음
        if (settings.autoTts && result.translatedText) {
          setIsSpeaking(true);
          synthesizerService.speak(result.translatedText, settings.ttsVoiceRate, () => {
            setIsSpeaking(false);
          });
        }
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || '번역 중 오류가 발생했습니다.');
      }
    },
    [settings, status, synthesizerService]
  );

  // Initialize Speech Recognition callbacks
  useEffect(() => {
    recognitionRef.current = new SpeechRecognitionService({
      onStart: () => {
        setIsListening(true);
      },
      onEnd: () => {
        setIsListening(false);
      },
      onResult: (interim, final) => {
        if (interim) {
          setInterimText(interim);
        }
        if (final) {
          setInterimText('');
          setSourceText((prev) => {
            const next = prev ? `${prev} ${final}` : final;
            executeTranslation(next, 'mic');
            return next;
          });
        }
      },
      onError: (errMsg) => {
        showToast(errMsg);
        setIsListening(false);
        visualizerService.stop();
      },
    });

    return () => {
      recognitionRef.current?.stop();
      visualizerService.stop();
      synthesizerService.stop();
    };
  }, [executeTranslation, showToast, visualizerService, synthesizerService]);

  // Mic Toggle Handler
  const handleToggleMic = async () => {
    if (isListening) {
      recognitionRef.current?.stop();
      visualizerService.stop();
      setIsListening(false);
    } else {
      if (!SpeechRecognitionService.isSupported()) {
        showToast('현재 브라우저에서는 음성 인식을 지원하지 않습니다. Chrome을 권장합니다.');
        return;
      }

      const audioStarted = await visualizerService.start();
      if (!audioStarted) {
        showToast('마이크 연결 권한이 필요합니다.');
        return;
      }

      const recStarted = recognitionRef.current?.start();
      if (recStarted) {
        setIsListening(true);
      } else {
        visualizerService.stop();
      }
    }
  };

  // Text Change Handler with Debounced Translation
  const handleTextChange = (newText: string) => {
    setSourceText(newText);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!newText.trim()) {
      setTranslatedText('');
      setStatus('idle');
      setErrorMessage(null);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      executeTranslation(newText, 'text');
    }, settings.debounceMs || 500);
  };

  // Clear Text
  const handleClearText = () => {
    setSourceText('');
    setInterimText('');
    setTranslatedText('');
    setStatus('idle');
    setErrorMessage(null);
    lastTranslatedTextRef.current = '';
    synthesizerService.stop();
    setIsSpeaking(false);
  };

  // Prompt chip select
  const handleSelectPrompt = (promptText: string) => {
    setSourceText(promptText);
    executeTranslation(promptText, 'text');
  };

  // Paste from clipboard
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        handleTextChange(text);
        showToast('클립보드 내용을 붙여넣었습니다.');
      }
    } catch {
      showToast('클립보드 읽기 권한을 확인해 주세요.');
    }
  };

  // TTS speak handler
  const handleSpeak = (text: string) => {
    if (!text.trim()) return;
    setIsSpeaking(true);
    synthesizerService.speak(text, settings.ttsVoiceRate, () => {
      setIsSpeaking(false);
    });
  };

  const handleStopSpeak = () => {
    synthesizerService.stop();
    setIsSpeaking(false);
  };

  // History operations
  const handleToggleFavorite = (id: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isFavorite: !r.isFavorite } : r))
    );
  };

  const handleDeleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    showToast('기록이 삭제되었습니다.');
  };

  const handleClearAllRecords = () => {
    if (window.confirm('정말 모든 번역 기록을 삭제하시겠습니까?')) {
      setRecords([]);
      showToast('모든 기록이 비워졌습니다.');
    }
  };

  const handleExportHistory = (format: 'txt' | 'json') => {
    StorageService.exportAsFile(records, format);
    showToast(`${format.toUpperCase()} 파일로 내보냈습니다.`);
  };

  const handleSelectRecordFromHistory = (rec: TranslationRecord) => {
    setSourceText(rec.sourceText);
    setTranslatedText(rec.translatedText);
    setStatus('success');
    setLatencyMs(rec.latencyMs);
    lastTranslatedTextRef.current = rec.sourceText;
    setShowHistory(false);
  };

  return (
    <div className={`app-layout ${isHUDMode ? 'hud-active' : ''}`}>
      {/* Top Header */}
      <Header
        settings={settings}
        isListening={isListening}
        historyCount={records.length}
        showHistory={showHistory}
        isHUDMode={isHUDMode}
        onToggleHUD={() => setIsHUDMode(!isHUDMode)}
        onToggleHistory={() => setShowHistory(!showHistory)}
        onOpenSettings={() => setShowSettings(true)}
        onOpenAudioGuide={() => setShowAudioGuide(true)}
      />

      {/* Main Dual Workspace */}
      <main className="main-content">
        <DualWorkspace
          sourceText={sourceText}
          interimText={interimText}
          isListening={isListening}
          volume={volume}
          visualizerService={visualizerService}
          onVolumeChange={setVolume}
          onTextChange={handleTextChange}
          onToggleMic={handleToggleMic}
          onClearText={handleClearText}
          onSelectPrompt={handleSelectPrompt}
          onPasteClipboard={handlePasteClipboard}
          translatedText={translatedText}
          status={status}
          engine={settings.engine}
          tone={settings.tone}
          latencyMs={latencyMs}
          errorMessage={errorMessage}
          onSpeak={handleSpeak}
          onStopSpeak={handleStopSpeak}
          isSpeaking={isSpeaking}
          onRetry={() => executeTranslation(sourceText, 'text')}
        />
      </main>

      {/* Floating Subtitle HUD for Video Meetings */}
      {isHUDMode && (
        <MeetingHUD
          currentEnglish={sourceText}
          interimEnglish={interimText}
          currentKorean={translatedText}
          recentRecords={records}
          isListening={isListening}
          engine={settings.engine}
          onToggleMic={handleToggleMic}
          onExitHUD={() => setIsHUDMode(false)}
          onSpeak={handleSpeak}
        />
      )}

      {/* History Slide-out Drawer */}
      {showHistory && (
        <HistoryList
          records={records}
          onToggleFavorite={handleToggleFavorite}
          onDeleteRecord={handleDeleteRecord}
          onClearAll={handleClearAllRecords}
          onExport={handleExportHistory}
          onSpeak={handleSpeak}
          onSelectRecord={handleSelectRecordFromHistory}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        settings={settings}
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={handleSaveSettings}
      />

      {/* Audio Guide Modal for Video Conference Audio Routing */}
      <AudioGuideModal
        isOpen={showAudioGuide}
        onClose={() => setShowAudioGuide(false)}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="toast-notification">
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

export default App;
