// ============================================================
// VoicePrint Note - Core Type Definitions
// ============================================================

/** 지원 언어 */
export type Language = "en" | "ko";

/** 화자 프로필 */
export interface Speaker {
  id: string;
  name: string;
  title?: string; // 직함 (e.g., "Art Director")
  color: string; // UI 식별 색상
  voicePrintId?: string; // ElevenLabs 성문 ID
  /** 다국어 성문 매핑 — 같은 사람이라도 언어별 톤이 다를 수 있음 */
  crossLanguageIds?: Record<Language, string>;
}

/** 용어집 항목 */
export interface GlossaryEntry {
  id: string;
  source: string; // 원문 용어 (e.g., "NPC AI")
  target: string; // 번역 용어 (e.g., "NPC 인공지능")
  context?: string; // 추가 맥락 설명
  createdAt: number;
}

/** 번역자 주(Note) */
export interface TranslatorNote {
  phrase: string; // 원문 표현
  explanation: string; // 뉘앙스/비유 설명
}

/** 개별 발화 세그먼트 */
export interface Utterance {
  id: string;
  speakerId: string;
  originalText: string; // 원문 (영어)
  translatedText: string; // 번역문 (한국어)
  language: Language; // 발화 언어
  timestamp: number;
  isPartial: boolean; // 스트리밍 중 부분 결과 여부
  translatorNotes?: TranslatorNote[];
}

/** 회의 세션 */
export interface MeetingSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  speakers: Speaker[];
  utterances: Utterance[];
  glossaryIds: string[]; // 적용된 용어집 ID 목록
}

/** 통역 모드 뷰 타입 */
export type InterpreterViewMode = "subtitle" | "script";

/** WebSocket 이벤트 */
export interface WSEvents {
  "audio:chunk": { data: ArrayBuffer; sessionId: string };
  "utterance:partial": Utterance;
  "utterance:final": Utterance;
  "speaker:identified": { speakerId: string; confidence: number };
  "translation:update": {
    utteranceId: string;
    translatedText: string;
    isPartial: boolean;
    notes?: TranslatorNote[];
  };
}

/** 앱 전체 설정 */
export interface AppSettings {
  viewMode: InterpreterViewMode;
  showOriginal: boolean;
  showTranslation: boolean;
  showTranslatorNotes: boolean;
  sourceLanguage: Language;
  targetLanguage: Language;
  context: string; // 번역 컨텍스트 (e.g., "게임 개발 회의")
}

/** API 응답 래퍼 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
