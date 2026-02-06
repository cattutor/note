// ============================================================
// 상수 & 기본값
// ============================================================

import type { AppSettings, Speaker } from "@/types";

export const DEFAULT_SETTINGS: AppSettings = {
  viewMode: "subtitle",
  showOriginal: true,
  showTranslation: true,
  showTranslatorNotes: true,
  sourceLanguage: "en",
  targetLanguage: "ko",
  context: "게임 개발 회의",
};

export const SPEAKER_COLORS = [
  "#3B82F6", // blue
  "#EF4444", // red
  "#10B981", // emerald
  "#F59E0B", // amber
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#F97316", // orange
];

export const DEFAULT_SPEAKERS: Speaker[] = [
  { id: "speaker-1", name: "James", title: "Art Director", color: SPEAKER_COLORS[0] },
  { id: "speaker-2", name: "김팀장", title: "Team Lead", color: SPEAKER_COLORS[1] },
  { id: "speaker-3", name: "Sarah", title: "Game Designer", color: SPEAKER_COLORS[2] },
];

/** 데모용 기본 용어집 */
export const DEFAULT_GLOSSARY = [
  { source: "NPC", target: "NPC", context: "Non-Player Character" },
  { source: "build", target: "빌드", context: "소프트웨어 빌드(컴파일 결과물)" },
  { source: "dungeon", target: "던전", context: "게임 내 던전 지역" },
  { source: "spawn", target: "스폰", context: "게임 오브젝트 생성" },
  { source: "nerf", target: "너프", context: "밸런스 하향 조정" },
  { source: "buff", target: "버프", context: "밸런스 상향 조정" },
  { source: "patch", target: "패치", context: "소프트웨어 업데이트" },
  { source: "hotfix", target: "핫픽스", context: "긴급 수정 배포" },
  { source: "shader", target: "셰이더", context: "그래픽 렌더링 프로그램" },
  { source: "asset", target: "에셋", context: "게임 리소스 파일" },
];

export const TRANSLATION_CONTEXTS = [
  "게임 개발 회의",
  "게임 디자인 리뷰",
  "QA / 버그 리뷰",
  "아트 리뷰",
  "기술 회의",
  "비즈니스 미팅",
  "GDC 컨퍼런스",
  "일반 대화",
];
