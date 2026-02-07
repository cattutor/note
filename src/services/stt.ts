// ============================================================
// STT Service — Speech-to-Text (Web Speech API wrapper)
// + MediaRecorder 오디오 캡처 (화자 식별용)
// ============================================================

export interface STTCallbacks {
  onPartialResult: (text: string) => void;
  onFinalResult: (text: string, audioBlob?: Blob) => void;
  onError: (error: string) => void;
  onEnd: () => void;
}

/**
 * Web Speech API 기반 STT 컨트롤러.
 * captureAudio=true면 MediaRecorder를 병행하여 화자 식별용 오디오도 캡처.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export class STTController {
  private recognition: any = null;
  private isRunning = false;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private captureAudio: boolean;

  constructor(
    private callbacks: STTCallbacks,
    private lang: string = "en-US",
    captureAudio: boolean = false
  ) {
    this.captureAudio = captureAudio;
  }

  async start(): Promise<boolean> {
    const w = window as any;
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this.callbacks.onError("이 브라우저는 음성인식을 지원하지 않습니다.");
      return false;
    }

    // 오디오 캡처 시작 (화자 식별용)
    if (this.captureAudio) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.mediaRecorder = new MediaRecorder(stream, {
          mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4",
        });
        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            this.audioChunks.push(e.data);
          }
        };
        this.mediaRecorder.start(1000);
      } catch (e) {
        console.warn("오디오 캡처 실패, 텍스트만 사용합니다:", e);
        this.captureAudio = false;
      }
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
          let audioBlob: Blob | undefined;
          if (this.captureAudio && this.audioChunks.length > 0) {
            audioBlob = new Blob(this.audioChunks, {
              type: this.mediaRecorder?.mimeType || "audio/webm",
            });
            this.audioChunks = [];
          }
          this.callbacks.onFinalResult(text, audioBlob);
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
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach((t) => t.stop());
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
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
