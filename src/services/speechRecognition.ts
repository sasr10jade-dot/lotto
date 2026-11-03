// Web Speech API Types Declaration
interface IWindowSpeechRecognition extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export interface SpeechRecognitionCallbacks {
  onResult: (interimTranscript: string, finalTranscript: string) => void;
  onStart: () => void;
  onEnd: () => void;
  onError: (errorMessage: string) => void;
}

export class SpeechRecognitionService {
  private recognition: any = null;
  private isListeningActive = false;
  private shouldAutoRestart = true;
  private callbacks: SpeechRecognitionCallbacks;

  constructor(callbacks: SpeechRecognitionCallbacks) {
    this.callbacks = callbacks;
    this.initRecognition();
  }

  public static isSupported(): boolean {
    const win = window as unknown as IWindowSpeechRecognition;
    return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
  }

  private initRecognition() {
    const win = window as unknown as IWindowSpeechRecognition;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      this.callbacks.onError('현재 브라우저에서는 음성 인식을 지원하지 않습니다. Chrome 또는 Edge 브라우저를 권장합니다.');
      return;
    }

    try {
      this.recognition = new SpeechRecognitionClass();
      this.recognition.lang = 'en-US';
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isListeningActive = true;
        this.callbacks.onStart();
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          const text = item[0]?.transcript || '';
          if (item.isFinal) {
            finalTranscript += text + ' ';
          } else {
            interimTranscript += text;
          }
        }

        this.callbacks.onResult(interimTranscript.trim(), finalTranscript.trim());
      };

      this.recognition.onerror = (event: any) => {
        let msg = '음성 인식 중 오류가 발생했습니다.';
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          msg = '마이크 사용 권한이 거부되었습니다. 브라우저 주소창 좌측 마이크 아이콘에서 권한을 허용해 주세요.';
          this.shouldAutoRestart = false;
        } else if (event.error === 'no-speech') {
          // 일시적인 무음 상태는 에러 알림 생략하고 계속 대기
          return;
        } else if (event.error === 'network') {
          msg = '네트워크 연결 상태를 확인해 주세요.';
        }
        this.callbacks.onError(msg);
      };

      this.recognition.onend = () => {
        // 사용자가 명시적으로 중지하지 않았고, 계속 들어야 하는 상태면 자동 재시작
        if (this.isListeningActive && this.shouldAutoRestart) {
          try {
            this.recognition.start();
            return;
          } catch {
            // 재시작 에러는 무시
          }
        }
        this.isListeningActive = false;
        this.callbacks.onEnd();
      };
    } catch (err: any) {
      this.callbacks.onError('음성 인식 초기화 실패: ' + (err.message || String(err)));
    }
  }

  public start(): boolean {
    if (!this.recognition) {
      this.initRecognition();
    }
    if (!this.recognition) return false;

    this.shouldAutoRestart = true;
    try {
      this.recognition.start();
      return true;
    } catch (err: any) {
      // 이미 시작된 상태인 경우
      if (err.name === 'InvalidStateError') {
        this.isListeningActive = true;
        return true;
      }
      this.callbacks.onError('마이크 시작 실패: ' + (err.message || String(err)));
      return false;
    }
  }

  public stop() {
    this.shouldAutoRestart = false;
    this.isListeningActive = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // 이미 멈춘 경우 무시
      }
    }
  }

  public isListening(): boolean {
    return this.isListeningActive;
  }
}
