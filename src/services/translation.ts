// ============================================================
// Translation Service — 맥락 인식 번역 엔진
// Built-in 룰 기반 + Gemini API + DeepL API 지원
// ============================================================

import type { TranslatorNote, GlossaryEntry, ApiKeys } from "@/types";
import { applyGlossaryHints } from "./glossary";

export interface TranslationResult {
  translatedText: string;
  notes: TranslatorNote[];
}

/**
 * 맥락 인식 번역 수행.
 * 우선순위: Gemini → DeepL → Built-in 룰 기반
 * direction: "en→ko" 또는 "ko→en"
 */
export async function translateText(
  text: string,
  context: string,
  glossary: GlossaryEntry[],
  includeNotes: boolean = true,
  apiKeys?: ApiKeys,
  direction: "en→ko" | "ko→en" = "en→ko"
): Promise<TranslationResult> {
  // 1. 용어집 힌트 적용
  const { appliedTerms } = applyGlossaryHints(text);

  // 2. 번역 수행 (API 키가 있으면 외부 API 사용)
  let translated: string;

  const engine = apiKeys?.gemini ? "gemini" : apiKeys?.deepL ? "deepL" : "built-in";
  console.log(`[Translation] engine=${engine}, direction=${direction}, text="${text.slice(0, 40)}...", hasKeys=${JSON.stringify(Object.keys(apiKeys || {}))}`);

  if (apiKeys?.gemini) {
    translated = await translateWithGemini(text, context, appliedTerms, apiKeys.gemini, 0, direction);
  } else if (apiKeys?.deepL) {
    translated = await translateWithDeepL(text, appliedTerms, apiKeys.deepL, direction);
  } else {
    translated = fallbackTranslation(text, appliedTerms, direction);
  }

  // 3. 번역자 주(Notes) 생성 (EN→KO일 때만)
  const notes: TranslatorNote[] = [];
  if (includeNotes && direction === "en→ko") {
    const detectedIdioms = detectIdioms(text);
    notes.push(...detectedIdioms);
  }

  return { translatedText: translated, notes };
}

// --- Gemini API Translation (큐 기반 속도 제한) ---

// 요청 큐: 분당 10회 이내로 유지 (Gemini Free 안전 마진)
const geminiCallTimes: number[] = [];
const GEMINI_RPM_LIMIT = 10;
const GEMINI_WINDOW_MS = 60_000;

async function waitForGeminiSlot(): Promise<void> {
  // 1분 이내 호출 기록 정리
  const now = Date.now();
  while (geminiCallTimes.length > 0 && now - geminiCallTimes[0] > GEMINI_WINDOW_MS) {
    geminiCallTimes.shift();
  }
  // 제한 초과 시 가장 오래된 호출이 1분 지날 때까지 대기
  if (geminiCallTimes.length >= GEMINI_RPM_LIMIT) {
    const waitMs = GEMINI_WINDOW_MS - (now - geminiCallTimes[0]) + 500;
    console.warn(`[Gemini] RPM 제한 도달, ${(waitMs/1000).toFixed(1)}초 대기...`);
    await new Promise((r) => setTimeout(r, waitMs));
    return waitForGeminiSlot();
  }
  geminiCallTimes.push(Date.now());
}

async function translateWithGemini(
  text: string,
  context: string,
  glossaryTerms: { source: string; target: string }[],
  apiKey: string,
  retryCount = 0,
  direction: "en→ko" | "ko→en" = "en→ko"
): Promise<string> {
  try {
    await waitForGeminiSlot();

    const glossaryHint = glossaryTerms.length > 0
      ? `\n용어집: ${glossaryTerms.map(t => `${t.source}=${t.target}`).join(", ")}`
      : "";

    const prompt = direction === "en→ko"
      ? `You are a professional English-Korean translator specializing in ${context}.
Translate the following English text to natural Korean.
- Use appropriate Korean technical terms for the ${context} domain.
- Keep proper nouns, brand names, and technical abbreviations in English.
- Translate naturally, not word-by-word.${glossaryHint}

English: ${text}

Korean translation (only the translation, no explanation):`
      : `You are a professional Korean-English translator specializing in ${context}.
Translate the following Korean text to natural English.
- Use appropriate English technical terms for the ${context} domain.
- Keep Korean proper nouns in their romanized form if widely known.
- Translate naturally, not word-by-word.${glossaryHint}

Korean: ${text}

English translation (only the translation, no explanation):`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    // 429 → 재시도 1회
    if (res.status === 429 && retryCount < 1) {
      console.warn("[Gemini] 429, 15초 후 재시도...");
      await new Promise((r) => setTimeout(r, 15000));
      return translateWithGemini(text, context, glossaryTerms, apiKey, retryCount + 1, direction);
    }

    if (!res.ok) {
      if (res.status === 429) {
        console.warn("[Gemini] RPM 초과 — fallback 전환");
      } else {
        console.error("Gemini API error:", res.status);
      }
      return fallbackTranslation(text, glossaryTerms, direction);
    }

    const data = await res.json();
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return result || fallbackTranslation(text, glossaryTerms, direction);
  } catch (e) {
    console.error("Gemini translation failed:", e);
    return fallbackTranslation(text, glossaryTerms, direction);
  }
}

// --- DeepL API Translation ---

async function translateWithDeepL(
  text: string,
  glossaryTerms: { source: string; target: string }[],
  apiKey: string,
  direction: "en→ko" | "ko→en" = "en→ko"
): Promise<string> {
  try {
    // Determine if free or pro key
    const isFreeKey = apiKey.endsWith(":fx");
    const baseUrl = isFreeKey
      ? "https://api-free.deepl.com/v2/translate"
      : "https://api.deepl.com/v2/translate";

    const sourceLang = direction === "en→ko" ? "EN" : "KO";
    const targetLang = direction === "en→ko" ? "KO" : "EN-US";

    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: [text],
        source_lang: sourceLang,
        target_lang: targetLang,
      }),
    });

    if (!res.ok) {
      console.error("DeepL API error:", res.status);
      return fallbackTranslation(text, glossaryTerms, direction);
    }

    const data = await res.json();
    let translated = data.translations?.[0]?.text || "";

    // Apply glossary terms on top of DeepL result
    if (translated && glossaryTerms.length > 0) {
      for (const term of glossaryTerms) {
        const regex = new RegExp(escapeRegex(term.source), "gi");
        translated = translated.replace(regex, term.target);
      }
    }

    return translated || fallbackTranslation(text, glossaryTerms, direction);
  } catch (e) {
    console.error("DeepL translation failed:", e);
    return fallbackTranslation(text, glossaryTerms, direction);
  }
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

/** 번역 실패 시 방향에 따른 fallback */
function fallbackTranslation(
  text: string,
  glossaryTerms: { source: string; target: string }[],
  direction: "en→ko" | "ko→en"
): string {
  if (direction === "en→ko") {
    return applyRuleBasedTranslation(text, glossaryTerms);
  }
  // KO→EN: API 없이는 번역 불가, 원문 그대로 반환
  return text;
}

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

/** 텍스트의 언어를 감지 (한글 비율 기반) */
export function detectLanguage(text: string): "ko" | "en" {
  const koreanChars = text.match(/[\uAC00-\uD7AF\u3130-\u318F]/g);
  const totalAlpha = text.match(/[a-zA-Z\uAC00-\uD7AF\u3130-\u318F]/g);
  if (!totalAlpha || totalAlpha.length === 0) return "en";
  const koreanRatio = (koreanChars?.length || 0) / totalAlpha.length;
  return koreanRatio > 0.3 ? "ko" : "en";
}
