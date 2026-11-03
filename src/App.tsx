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
import { AppSettings, SupportedLang, TargetLang, TranslationRecord, TranslationStatus, ViewMode } from './types';
import './App.css';

export function App() {
  // Settings & History state
  const [settings, setSettings] = useState<AppSettings>(() => StorageService.getSettings());
  const [records, setRecords] = useState<TranslationRecord[]>(() => StorageService.getHistory());

  // View Mode: 'normal' (default), 'wide', 'hud'
  const [viewMode, setViewMode] = useState<ViewMode>(settings.defaultViewMode || 'normal');

  // Language Direction state
  const [sourceLang, setSourceLang] = useState<SupportedLang>('auto');
  const [targetLang, setTargetLang] = useState<TargetLang>('ko');

  // Input & Output Text state
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

  // Modal / Drawer state
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAudioGuide, setShowAudioGuide] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // PWA Install state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstallPWA, setCanInstallPWA] = useState(false);

  // Services instances
  const visualizerService = useMemo(() => new AudioVisualizerService(), []);
  const synthesizerService = useMemo(() => SpeechSynthesizerService.getInstance(), []);
  const recognitionRef = useRef<SpeechRecognitionService | null>(null);

  // Debounce & Translation Race Condition Guard
  const debounceTimerRef = useRef<any>(null);
  const currentRequestIdRef = useRef<number>(0);
  const lastTranslatedTextRef = useRef<string>('');

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast(null);
    }, 3200);
  }, []);

  // Capture PWA beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstallPWA(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 이미 독립 창(PWA)으로 실행 중인지 확인
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setCanInstallPWA(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        showToast('바탕화면에 앱이 성공적으로 설치되었습니다!');
        setCanInstallPWA(false);
      }
      setDeferredPrompt(null);
    } else {
      showToast('브라우저 주소창 우측 상단의 [설치] 또는 [바로가기 추가] 아이콘을 클릭해 주세요.');
    }
  };

  // Save history on change
  useEffect(() => {
    StorageService.saveHistory(records);
  }, [records]);

  // Save settings
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
    showToast('설정이 성공적으로 저장되었습니다.');
  };

  // Swap Source <-> Target Languages
  const handleSwapLanguages = () => {
    const nextTarget: TargetLang = targetLang === 'ko' ? 'en' : 'ko';
    const nextSource: SupportedLang = nextTarget === 'ko' ? 'en' : 'ko';

    setSourceLang(nextSource);
    setTargetLang(nextTarget);

    // 음성 인식기 언어도 함께 전환
    const speechLang = nextSource === 'ko' ? 'ko-KR' : 'en-US';
    recognitionRef.current?.setLang(speechLang);

    // 텍스트가 있으면 맞교환
    if (translatedText.trim()) {
      setSourceText(translatedText);
      setTranslatedText(sourceText);
      lastTranslatedTextRef.current = translatedText;
    }

    showToast(`번역 방향이 [${nextSource === 'en' ? '영어 ➔ 한국어' : '한국어 ➔ 영어'}]로 전환되었습니다.`);
  };

  // Core High-Performance Translation Executor
  const executeTranslation = useCallback(
    async (text: string, currentSrc: SupportedLang = sourceLang, currentTgt: TargetLang = targetLang, sourceType: 'mic' | 'text' = 'text') => {
      const trimmed = text.trim();
      if (!trimmed) {
        setTranslatedText('');
        setStatus('idle');
        setErrorMessage(null);
        return;
      }

      // 동일한 텍스트 중복 호출 방지
      if (trimmed === lastTranslatedTextRef.current && status === 'success') {
        return;
      }

      // Race condition 차단: 요청 고유 ID 증가
      const reqId = ++currentRequestIdRef.current;
      setStatus('translating');
      setErrorMessage(null);

      // 자동 언어 감지: 텍스트에 한글이 있으면 ko -> en, 영문 위주면 en -> ko
      let effectiveSrc = currentSrc;
      let effectiveTgt = currentTgt;
      if (currentSrc === 'auto') {
        const hasKorean = /[가-힣]/.test(trimmed);
        effectiveSrc = hasKorean ? 'ko' : 'en';
        effectiveTgt = hasKorean ? 'en' : 'ko';
      }

      try {
        const result = await translationManager.translate(
          trimmed,
          settings,
          effectiveSrc,
          effectiveTgt
        );

        // 이전 요청이 나중에 끝난 경우 무시
        if (reqId !== currentRequestIdRef.current) {
          return;
        }

        lastTranslatedTextRef.current = trimmed;
        setTranslatedText(result.translatedText);
        setLatencyMs(result.latencyMs);
        setStatus('success');

        // 히스토리 기록 저장 (단어 수가 있거나 유의미한 길이일 때)
        if (result.translatedText) {
          const newRecord: TranslationRecord = {
            id: `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            timestamp: Date.now(),
            sourceText: trimmed,
            translatedText: result.translatedText,
            sourceLang: effectiveSrc,
            targetLang: effectiveTgt,
            sourceType,
            engine: result.engine,
            tone: settings.tone,
            latencyMs: result.latencyMs,
            isFavorite: false,
          };
          setRecords((prev) => [newRecord, ...prev.filter((r) => r.sourceText !== trimmed)]);
        }

        // Auto TTS 옵션 활성화 시 자동 읽기
        if (settings.autoTts && result.translatedText) {
          setIsSpeaking(true);
          const ttsLang = effectiveTgt === 'ko' ? 'ko-KR' : 'en-US';
          synthesizerService.speak(result.translatedText, ttsLang, settings.ttsVoiceRate, () => {
            setIsSpeaking(false);
          });
        }
      } catch (err: any) {
        if (reqId === currentRequestIdRef.current) {
          setStatus('error');
          setErrorMessage(err.message || '번역 중 오류가 발생했습니다.');
        }
      }
    },
    [sourceLang, targetLang, settings, status, synthesizerService]
  );

  // Initialize Speech Recognition callbacks
  useEffect(() => {
    const initialSpeechLang = sourceLang === 'ko' ? 'ko-KR' : 'en-US';
    recognitionRef.current = new SpeechRecognitionService(
      {
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
          // 문장이 완성(Final)되었을 때만 번역기로 전달하여 문맥 품질을 극대화
          if (final) {
            setInterimText('');
            setSourceText((prev) => {
              const next = prev ? `${prev} ${final}` : final;
              executeTranslation(next, sourceLang, targetLang, 'mic');
              return next;
            });
          }
        },
        onError: (errMsg) => {
          showToast(errMsg);
          setIsListening(false);
          visualizerService.stop();
        },
      },
      initialSpeechLang
    );

    return () => {
      recognitionRef.current?.stop();
      visualizerService.stop();
      synthesizerService.stop();
    };
  }, [executeTranslation, showToast, sourceLang, targetLang, visualizerService, synthesizerService]);

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

      // 현재 선택된 언어 적용
      const speechLang = sourceLang === 'ko' ? 'ko-KR' : 'en-US';
      recognitionRef.current?.setLang(speechLang);

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

  // Text Change Handler with Auto-Detection & Debounce
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

    // 언어 자동 감지
    let currentSrc = sourceLang;
    let currentTgt = targetLang;
    if (sourceLang === 'auto') {
      const isKorean = /[가-힣]/.test(newText);
      currentTgt = isKorean ? 'en' : 'ko';
    }

    debounceTimerRef.current = setTimeout(() => {
      executeTranslation(newText, currentSrc, currentTgt, 'text');
    }, settings.debounceMs || 450);
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
    executeTranslation(promptText, sourceLang, targetLang, 'text');
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
    const ttsLang = targetLang === 'ko' ? 'ko-KR' : 'en-US';
    synthesizerService.speak(text, ttsLang, settings.ttsVoiceRate, () => {
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
    setSourceLang(rec.sourceLang);
    setTargetLang(rec.targetLang);
    setStatus('success');
    setLatencyMs(rec.latencyMs);
    lastTranslatedTextRef.current = rec.sourceText;
    setShowHistory(false);
  };

  return (
    <div className={`app-layout layout-${viewMode}`}>
      {/* Top Header */}
      <Header
        settings={settings}
        isListening={isListening}
        historyCount={records.length}
        showHistory={showHistory}
        viewMode={viewMode}
        sourceLang={sourceLang}
        targetLang={targetLang}
        canInstallPWA={canInstallPWA}
        onInstallPWA={handleInstallPWA}
        onChangeViewMode={(mode) => setViewMode(mode)}
        onSwapLanguages={handleSwapLanguages}
        onToggleHistory={() => setShowHistory(!showHistory)}
        onOpenSettings={() => setShowSettings(true)}
        onOpenAudioGuide={() => setShowAudioGuide(true)}
      />

      {/* Main Dual Workspace: displayed in normal and wide modes */}
      {viewMode !== 'hud' && (
        <main className="main-content">
          <DualWorkspace
            sourceLang={sourceLang}
            targetLang={targetLang}
            viewMode={viewMode}
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
            onRetry={() => executeTranslation(sourceText, sourceLang, targetLang, 'text')}
          />
        </main>
      )}

      {/* Floating Subtitle HUD for Video Meetings */}
      {viewMode === 'hud' && (
        <MeetingHUD
          currentEnglish={sourceText}
          interimEnglish={interimText}
          currentKorean={translatedText}
          recentRecords={records}
          isListening={isListening}
          engine={settings.engine}
          sourceLang={sourceLang}
          targetLang={targetLang}
          onToggleMic={handleToggleMic}
          onExitHUD={() => setViewMode('normal')}
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
