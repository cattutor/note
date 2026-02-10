"use client";

// ============================================================
// Script View — 대본형 통역 모드 (좌우 분할)
// ============================================================

import React, { useEffect, useRef, useState } from "react";
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
  const leftBottomRef = useRef<HTMLDivElement>(null);
  const rightBottomRef = useRef<HTMLDivElement>(null);
  const leftContainerRef = useRef<HTMLDivElement>(null);
  const rightContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // 자동 스크롤: 새 발화가 추가될 때
  useEffect(() => {
    if (autoScroll) {
      leftBottomRef.current?.scrollIntoView({ behavior: "smooth" });
      rightBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [utterances, partialUtterance, autoScroll]);

  // 사용자가 수동 스크롤하면 자동 스크롤 해제, 맨 아래 도달 시 다시 활성화
  const handleScroll = (container: HTMLDivElement | null) => {
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 60;
    setAutoScroll(isNearBottom);
  };

  const getSpeaker = (id: string) =>
    speakers.find((s) => s.id === id) || {
      id,
      name: "Unknown",
      color: "#9CA3AF",
    };

  return (
    <div className="grid grid-cols-2 gap-0 h-full border border-zinc-800 rounded-xl overflow-hidden relative">
      {/* 좌측: 원문 */}
      <div className="flex flex-col border-r border-zinc-800">
        <div className="px-4 py-2 bg-zinc-800/50 text-xs font-medium text-zinc-400 uppercase tracking-wider">
          {sourceLanguage === "ko" ? "원문 (한국어)" : "Original (English)"}
        </div>
        <div
          ref={leftContainerRef}
          onScroll={() => handleScroll(leftContainerRef.current)}
          className="flex-1 overflow-y-auto p-4 space-y-3"
        >
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
          <div ref={leftBottomRef} />
        </div>
      </div>

      {/* 우측: 번역 */}
      <div className="flex flex-col">
        <div className="px-4 py-2 bg-zinc-800/50 text-xs font-medium text-zinc-400 uppercase tracking-wider">
          {sourceLanguage === "ko" ? "Translation (English)" : "번역 (한국어)"}
        </div>
        <div
          ref={rightContainerRef}
          onScroll={() => handleScroll(rightContainerRef.current)}
          className="flex-1 overflow-y-auto p-4 space-y-3"
        >
          {utterances.map((u) => {
            const speaker = getSpeaker(u.speakerId);
            return (
              <div key={u.id} className="animate-fade-in">
                <SpeakerBadge speaker={speaker} size="sm" />
                <p className="mt-1 text-blue-300 text-sm leading-relaxed pl-1">
                  {u.translatedText || (
                    <span className="text-zinc-600 italic">번역 대기</span>
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
          <div ref={rightBottomRef} />
        </div>
      </div>

      {/* 자동 스크롤 해제 시 하단 이동 버튼 */}
      {!autoScroll && (
        <button
          onClick={() => {
            setAutoScroll(true);
            leftBottomRef.current?.scrollIntoView({ behavior: "smooth" });
            rightBottomRef.current?.scrollIntoView({ behavior: "smooth" });
          }}
          className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-lg transition-colors z-10"
        >
          최신 대사로 이동
        </button>
      )}
    </div>
  );
}
