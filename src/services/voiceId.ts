// ============================================================
// Voice ID Service — 화자 식별 (VoicePrint)
// ============================================================
// 프로덕션에서는 ElevenLabs Voice ID API를 사용.
// 데모에서는 시뮬레이션으로 구현.

import type { Speaker, Language } from "@/types";
import { DEFAULT_SPEAKERS } from "@/lib/constants";

/** 등록된 화자 목록 */
let registeredSpeakers: Speaker[] = [...DEFAULT_SPEAKERS];

export function getRegisteredSpeakers(): Speaker[] {
  return [...registeredSpeakers];
}

export function registerSpeaker(speaker: Speaker): void {
  const existing = registeredSpeakers.findIndex((s) => s.id === speaker.id);
  if (existing >= 0) {
    registeredSpeakers[existing] = speaker;
  } else {
    registeredSpeakers.push(speaker);
  }
}

export function removeSpeaker(id: string): boolean {
  const before = registeredSpeakers.length;
  registeredSpeakers = registeredSpeakers.filter((s) => s.id !== id);
  return registeredSpeakers.length < before;
}

/**
 * Cross-Language ID: 언어가 달라도 동일 인물로 식별.
 * ElevenLabs 성문(Voice Print) 고유성 추적 시뮬레이션.
 */
export function identifySpeaker(
  _audioFeatures: unknown,
  _language: Language
): { speaker: Speaker; confidence: number } {
  // 데모: 랜덤 화자 선택 + 높은 신뢰도 시뮬레이션
  const idx = Math.floor(Math.random() * registeredSpeakers.length);
  return {
    speaker: registeredSpeakers[idx],
    confidence: 0.85 + Math.random() * 0.14, // 0.85 ~ 0.99
  };
}

/**
 * 특정 화자를 ID로 조회
 */
export function getSpeakerById(id: string): Speaker | undefined {
  return registeredSpeakers.find((s) => s.id === id);
}
