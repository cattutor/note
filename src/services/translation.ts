// ============================================================
// Translation Service — LLM 기반 맥락 인식 번역 엔진
// ============================================================

import type { TranslatorNote, GlossaryEntry } from "@/types";
import { applyGlossaryHints } from "./glossary";

export interface TranslationResult {
  translatedText: string;
  notes: TranslatorNote[];
}

/**
 * 맥락 인식 번역 수행.
 * 실제 프로덕션에서는 DeepL API Pro 또는 Gemini 1.5 Flash를 호출.
 * 여기서는 내장 룰 기반 + 시뮬레이션으로 구현.
 */
export async function translateText(
  text: string,
  context: string,
  glossary: GlossaryEntry[],
  includeNotes: boolean = true
): Promise<TranslationResult> {
  // 1. 용어집 힌트 적용
  const { appliedTerms } = applyGlossaryHints(text);

  // 2. 규칙 기반 번역 (데모용 — 프로덕션에서는 LLM API 호출)
  let translated = applyRuleBasedTranslation(text, appliedTerms);

  // 3. 번역자 주(Notes) 생성
  const notes: TranslatorNote[] = [];
  if (includeNotes) {
    const detectedIdioms = detectIdioms(text);
    notes.push(...detectedIdioms);
  }

  return { translatedText: translated, notes };
}

// --- Rule-based translation (데모 시뮬레이션) ---

interface TranslationRule {
  pattern: RegExp;
  replacement: string | ((match: RegExpMatchArray) => string);
  note?: TranslatorNote;
}

const TRANSLATION_RULES: TranslationRule[] = [
  {
    pattern: /\bWe need to tweak the lighting in the dungeon scene\b/i,
    replacement: "던전 씬의 라이팅을 조금 조정해야 합니다",
  },
  {
    pattern: /\bThe build is broken\b/i,
    replacement: "빌드(버전)가 깨졌습니다",
  },
  {
    pattern: /\bI think the NPC AI is too aggressive\b/i,
    replacement: "NPC 인공지능이 너무 공격적인 것 같아요",
  },
  {
    pattern: /\bWe should nerf the boss damage\b/i,
    replacement: "보스 데미지를 너프(하향 조정)해야 할 것 같습니다",
  },
  {
    pattern: /\bThe shader is causing performance issues\b/i,
    replacement: "셰이더가 성능 문제를 일으키고 있습니다",
  },
  {
    pattern: /\bLet's push the hotfix before the weekend\b/i,
    replacement: "주말 전에 핫픽스를 배포합시다",
  },
  {
    pattern: /\bThe spawn rate is too high\b/i,
    replacement: "스폰 비율이 너무 높습니다",
  },
  {
    pattern: /\bWe need more assets for the new level\b/i,
    replacement: "새 레벨을 위한 에셋이 더 필요합니다",
  },
  {
    pattern: /\bThe patch notes are ready\b/i,
    replacement: "패치 노트가 준비되었습니다",
  },
  {
    pattern: /\bLet's review the gameplay loop\b/i,
    replacement: "게임플레이 루프를 리뷰합시다",
  },
  {
    pattern: /\bI'll check the bug tracker\b/i,
    replacement: "버그 트래커를 확인해 보겠습니다",
  },
  {
    pattern: /\bThe frame rate drops in this area\b/i,
    replacement: "이 구역에서 프레임 레이트가 떨어집니다",
  },
  {
    pattern: /\bWe should buff the healer class\b/i,
    replacement: "힐러 클래스를 버프(상향 조정)해야 합니다",
  },
  {
    pattern: /\bHello everyone\b/i,
    replacement: "안녕하세요 여러분",
  },
  {
    pattern: /\bLet's get started\b/i,
    replacement: "시작하겠습니다",
  },
  {
    pattern: /\bAny questions\??\b/i,
    replacement: "질문 있으신가요?",
  },
  {
    pattern: /\bThat sounds good\b/i,
    replacement: "좋은 것 같습니다",
  },
  {
    pattern: /\bI agree\b/i,
    replacement: "동의합니다",
  },
  {
    pattern: /\bLet me share my screen\b/i,
    replacement: "화면 공유하겠습니다",
  },
  {
    pattern: /\bCan you hear me\??\b/i,
    replacement: "제 소리 들리시나요?",
  },
];

function applyRuleBasedTranslation(
  text: string,
  glossaryTerms: { source: string; target: string }[]
): string {
  // 전체 문장 매칭 시도
  for (const rule of TRANSLATION_RULES) {
    if (rule.pattern.test(text)) {
      return typeof rule.replacement === "function"
        ? rule.replacement(text.match(rule.pattern)!)
        : rule.replacement;
    }
  }

  // 부분 매칭: 용어집 용어만이라도 치환
  let result = text;
  for (const term of glossaryTerms) {
    const regex = new RegExp(`\\b${escapeRegex(term.source)}\\b`, "gi");
    result = result.replace(regex, term.target);
  }

  // 매칭되는 규칙이 없으면 간단한 표시와 함께 반환
  if (result === text) {
    return `[번역] ${text}`;
  }
  return result;
}

// --- Idiom / Nuance Detection ---

const IDIOM_MAP: Record<string, { translation: string; explanation: string }> = {
  "a piece of cake": {
    translation: "식은 죽 먹기",
    explanation: "매우 쉬운 일을 비유하는 표현",
  },
  "break a leg": {
    translation: "행운을 빌어",
    explanation: "공연/발표 전 행운을 비는 관용 표현",
  },
  "hit the nail on the head": {
    translation: "정곡을 찌르다",
    explanation: "정확하게 핵심을 짚었을 때 사용",
  },
  "back to square one": {
    translation: "원점으로 돌아가다",
    explanation: "처음부터 다시 시작해야 할 때 사용",
  },
  "the ball is in your court": {
    translation: "이제 당신 차례입니다",
    explanation: "결정/행동이 상대방에게 달려있음을 의미",
  },
  "cut corners": {
    translation: "대충 처리하다",
    explanation: "시간/비용 절약을 위해 품질을 낮추는 것",
  },
  "on the same page": {
    translation: "같은 생각이다",
    explanation: "서로 동일한 이해를 공유하고 있을 때",
  },
  "low-hanging fruit": {
    translation: "쉽게 달성 가능한 목표",
    explanation: "최소 노력으로 빠르게 달성할 수 있는 일",
  },
};

function detectIdioms(text: string): TranslatorNote[] {
  const notes: TranslatorNote[] = [];
  const lower = text.toLowerCase();

  for (const [idiom, info] of Object.entries(IDIOM_MAP)) {
    if (lower.includes(idiom)) {
      notes.push({
        phrase: idiom,
        explanation: `"${info.translation}" — ${info.explanation}`,
      });
    }
  }

  return notes;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
