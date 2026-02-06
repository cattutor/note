"use client";

// ============================================================
// Subtitle View — 자막형 통역 모드 (넷플릭스 스타일)
// ============================================================

import React, { useEffect, useRef } from "react";
import type { Utterance, Speaker } from "@/types";
import { SpeakerBadge } from "@/components/meeting/SpeakerBadge";
import { TranslatorNoteTag } from "@/components/meeting/TranslatorNoteTag";

interface SubtitleViewProps {
  utterances: Utterance[];
  speakers: Speaker[];
  partialUtterance: Utterance | null;
  showOriginal: boolean;
  showTranslation: boolean;
  showNotes: boolean;
}

export function SubtitleView({
  utterances,
  speakers,
  partialUtterance,
  showOriginal,
  showTranslation,
  showNotes,
}: SubtitleViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [utterances, partialUtterance]);

  const getSpeaker = (id: string) =>
    speakers.find((s) => s.id === id) || {
      id,
      name: "Unknown",
      color: "#9CA3AF",
    };

  return (
    <div className="flex flex-col gap-3 p-4 overflow-y-auto h-full">
      {utterances.map((u) => {
        const speaker = getSpeaker(u.speakerId);
        return (
          <div
            key={u.id}
            className="bg-zinc-900/80 backdrop-blur rounded-lg px-4 py-3 border border-zinc-800 animate-fade-in"
          >
            <SpeakerBadge speaker={speaker} size="sm" />
            <div className="mt-1.5 space-y-1">
              {showOriginal && (
                <p className="text-zinc-100 text-sm leading-relaxed">
                  {u.originalText}
                </p>
              )}
              {showTranslation && u.translatedText && (
                <p className="text-blue-300 text-sm leading-relaxed">
                  ({u.translatedText})
                </p>
              )}
            </div>
            {showNotes && u.translatorNotes && (
              <TranslatorNoteTag notes={u.translatorNotes} />
            )}
          </div>
        );
      })}

      {/* 현재 발화 중 (부분 결과) */}
      {partialUtterance && (
        <div className="bg-zinc-900/50 backdrop-blur rounded-lg px-4 py-3 border border-zinc-700 border-dashed">
          <SpeakerBadge
            speaker={getSpeaker(partialUtterance.speakerId)}
            size="sm"
          />
          <p className="mt-1.5 text-zinc-400 text-sm italic">
            {partialUtterance.originalText}
            <span className="animate-pulse ml-0.5">|</span>
          </p>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
