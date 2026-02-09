"use client";

// ============================================================
// Script View — 대본형 통역 모드 (좌우 분할)
// ============================================================

import React, { useEffect, useRef } from "react";
import type { Utterance, Speaker } from "@/types";
import { SpeakerBadge } from "@/components/meeting/SpeakerBadge";
import { TranslatorNoteTag } from "@/components/meeting/TranslatorNoteTag";

interface ScriptViewProps {
  utterances: Utterance[];
  speakers: Speaker[];
  partialUtterance: Utterance | null;
  showNotes: boolean;
  sourceLanguage?: "en" | "ko";
}

export function ScriptView({
  utterances,
  speakers,
  partialUtterance,
  showNotes,
  sourceLanguage = "en",
}: ScriptViewProps) {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    leftRef.current?.scrollTo({ top: leftRef.current.scrollHeight, behavior: "smooth" });
    rightRef.current?.scrollTo({ top: rightRef.current.scrollHeight, behavior: "smooth" });
  }, [utterances, partialUtterance]);

  const getSpeaker = (id: string) =>
    speakers.find((s) => s.id === id) || {
      id,
      name: "Unknown",
      color: "#9CA3AF",
    };

  return (
    <div className="grid grid-cols-2 gap-0 h-full border border-zinc-800 rounded-xl overflow-hidden">
      {/* 좌측: 원문 */}
      <div className="flex flex-col border-r border-zinc-800">
        <div className="px-4 py-2 bg-zinc-800/50 text-xs font-medium text-zinc-400 uppercase tracking-wider">
          {sourceLanguage === "ko" ? "원문 (한국어)" : "Original (English)"}
        </div>
        <div ref={leftRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {utterances.map((u) => {
            const speaker = getSpeaker(u.speakerId);
            return (
              <div key={u.id} className="animate-fade-in">
                <SpeakerBadge speaker={speaker} size="sm" />
                <p className="mt-1 text-zinc-200 text-sm leading-relaxed pl-1">
                  {u.originalText}
                </p>
              </div>
            );
          })}
          {partialUtterance && (
            <div>
              <SpeakerBadge
                speaker={getSpeaker(partialUtterance.speakerId)}
                size="sm"
              />
              <p className="mt-1 text-zinc-500 text-sm italic pl-1">
                {partialUtterance.originalText}
                <span className="animate-pulse ml-0.5">|</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 우측: 번역 */}
      <div className="flex flex-col">
        <div className="px-4 py-2 bg-zinc-800/50 text-xs font-medium text-zinc-400 uppercase tracking-wider">
          {sourceLanguage === "ko" ? "Translation (English)" : "번역 (한국어)"}
        </div>
        <div ref={rightRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {utterances.map((u) => {
            const speaker = getSpeaker(u.speakerId);
            return (
              <div key={u.id} className="animate-fade-in">
                <SpeakerBadge speaker={speaker} size="sm" />
                <p className="mt-1 text-blue-300 text-sm leading-relaxed pl-1">
                  {u.translatedText || (
                    <span className="text-zinc-600 italic">번역 중...</span>
                  )}
                </p>
                {showNotes && u.translatorNotes && (
                  <div className="pl-1">
                    <TranslatorNoteTag notes={u.translatorNotes} />
                  </div>
                )}
              </div>
            );
          })}
          {partialUtterance && (
            <div>
              <SpeakerBadge
                speaker={getSpeaker(partialUtterance.speakerId)}
                size="sm"
              />
              <p className="mt-1 text-zinc-600 text-sm italic pl-1">
                번역 대기 중...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
