// ============================================================
// STT Service — Speech-to-Text (Web Speech API wrapper)
// ============================================================

export interface STTCallbacks {
  onPartialResult: (text: string) => void;
  onFinalResult: (text: string) => void;
  onError: (error: string) => void;
  onEnd: () => void;
}

/**
 * Web Speech API 기반 STT 컨트롤러.
 * 브라우저 내장 음성인식을 사용하여 실시간 텍스트 변환.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export class STTController {
  private recognition: any = null;
  private isRunning = false;

  constructor(private callbacks: STTCallbacks, private lang: string = "en-US") {}

  start(): boolean {
    const w = window as any;
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this.callbacks.onError("이 브라우저는 음성인식을 지원하지 않습니다.");
      return false;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.lang;

    this.recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;

        if (result.isFinal) {
          this.callbacks.onFinalResult(text);
        } else {
          this.callbacks.onPartialResult(text);
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      this.callbacks.onError(`음성인식 오류: ${event.error}`);
    };

    this.recognition.onend = () => {
      if (this.isRunning) {
        try {
          this.recognition?.start();
        } catch {
          this.isRunning = false;
          this.callbacks.onEnd();
        }
      } else {
        this.callbacks.onEnd();
      }
    };

    try {
      this.recognition.start();
      this.isRunning = true;
      return true;
    } catch {
      this.callbacks.onError("음성인식을 시작할 수 없습니다.");
      return false;
    }
  }

  stop(): void {
    this.isRunning = false;
    this.recognition?.stop();
  }

  isActive(): boolean {
    return this.isRunning;
  }

  setLanguage(lang: string): void {
    this.lang = lang;
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }
}
