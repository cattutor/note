// ============================================================
// Glossary Service — 용어집 관리 & 치환
// ============================================================

import type { GlossaryEntry } from "@/types";
import { v4 as uuid } from "uuid";
import { DEFAULT_GLOSSARY } from "@/lib/constants";

/** 인메모리 용어집 저장소 (프로덕션에서는 Redis 대체) */
let glossaryStore: GlossaryEntry[] = DEFAULT_GLOSSARY.map((g) => ({
  id: uuid(),
  source: g.source,
  target: g.target,
  context: g.context,
  createdAt: Date.now(),
}));

export function getGlossary(): GlossaryEntry[] {
  return [...glossaryStore];
}

export function addGlossaryEntry(
  source: string,
  target: string,
  context?: string
): GlossaryEntry {
  const entry: GlossaryEntry = {
    id: uuid(),
    source,
    target,
    context,
    createdAt: Date.now(),
  };
  glossaryStore.push(entry);
  return entry;
}

export function removeGlossaryEntry(id: string): boolean {
  const before = glossaryStore.length;
  glossaryStore = glossaryStore.filter((e) => e.id !== id);
  return glossaryStore.length < before;
}

export function updateGlossaryEntry(
  id: string,
  updates: Partial<Pick<GlossaryEntry, "source" | "target" | "context">>
): GlossaryEntry | null {
  const entry = glossaryStore.find((e) => e.id === id);
  if (!entry) return null;
  Object.assign(entry, updates);
  return { ...entry };
}

/**
 * 텍스트에서 용어집 항목을 찾아 치환 힌트를 반환.
 * 번역 엔진에 전달하기 전에 이 힌트를 포함시켜 정확한 번역 유도.
 */
export function applyGlossaryHints(text: string): {
  processedText: string;
  appliedTerms: { source: string; target: string }[];
} {
  const appliedTerms: { source: string; target: string }[] = [];
  let processedText = text;

  // 긴 용어부터 매칭 (부분 매칭 방지)
  const sorted = [...glossaryStore].sort(
    (a, b) => b.source.length - a.source.length
  );

  for (const entry of sorted) {
    const regex = new RegExp(`\\b${escapeRegex(entry.source)}\\b`, "gi");
    if (regex.test(processedText)) {
      appliedTerms.push({ source: entry.source, target: entry.target });
    }
  }

  return { processedText, appliedTerms };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
