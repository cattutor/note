"use client";

// ============================================================
// MeetingMinutesPanel — 회의록 생성 패널
// Gemini API를 이용하여 노트테이킹 기록을 회의록으로 변환
// ============================================================

import React, { useState, useCallback } from "react";
import type { Utterance, Speaker, ApiKeys } from "@/types";

interface MeetingMinutesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  utterances: Utterance[];
  speakers: Speaker[];
  apiKeys: ApiKeys;
  context: string;
}

export function MeetingMinutesPanel({
  isOpen,
  onClose,
  utterances,
  speakers,
  apiKeys,
  context,
}: MeetingMinutesPanelProps) {
  const [minutes, setMinutes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getSpeakerName = (id: string) =>
    speakers.find((s) => s.id === id)?.name || "Unknown";

  const generateMinutes = useCallback(async () => {
    if (!apiKeys.gemini) {
      setError("Gemini API 키가 필요합니다. 설정에서 입력해주세요.");
      return;
    }
    if (utterances.length === 0) {
      setError("기록된 발화가 없습니다.");
      return;
    }

    setLoading(true);
    setError("");
    setMinutes("");

    // 발화 기록을 텍스트로 변환
    const transcript = utterances
      .map((u) => {
        const name = getSpeakerName(u.speakerId);
        const time = new Date(u.timestamp).toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const translation = u.translatedText ? ` (번역: ${u.translatedText})` : "";
        return `[${time}] ${name}: ${u.originalText}${translation}`;
      })
      .join("\n");

    const prompt = `당신은 전문 회의록 작성자입니다. 다음 회의 기록을 바탕으로 체계적인 회의록을 작성해주세요.

회의 컨텍스트: ${context}
참석자: ${speakers.map((s) => s.name).join(", ")}

## 회의 기록:
${transcript}

## 요청사항:
다음 형식으로 한국어 회의록을 작성해주세요:

1. **회의 요약** (3-5줄)
2. **주요 논의 사항** (번호별 정리)
3. **결정 사항** (있는 경우)
4. **액션 아이템** (담당자, 내용)
5. **기타 메모**

간결하고 명확하게 작성해주세요.`;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKeys.gemini}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 4096,
            },
          }),
        }
      );

      if (!res.ok) {
        if (res.status === 429) {
          setError("Gemini API 요청 한도 초과. 잠시 후 다시 시도해주세요.");
        } else {
          setError(`Gemini API 오류: ${res.status}`);
        }
        setLoading(false);
        return;
      }

      const data = await res.json();
      const result = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (result) {
        setMinutes(result);
      } else {
        setError("회의록 생성에 실패했습니다.");
      }
    } catch (e) {
      setError(`오류: ${e instanceof Error ? e.message : "알 수 없는 오류"}`);
    }

    setLoading(false);
  }, [utterances, speakers, apiKeys, context]);

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(minutes);
  }, [minutes]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl max-h-[80vh] bg-zinc-900 border border-zinc-700 rounded-xl flex flex-col mx-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="text-base font-bold text-zinc-100">회의록 생성</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!minutes && !loading && !error && (
            <div className="text-center py-8">
              <p className="text-zinc-400 text-sm mb-2">
                기록된 발화 {utterances.length}개를 기반으로 회의록을 생성합니다.
              </p>
              <p className="text-zinc-600 text-xs mb-6">
                Gemini AI가 회의 내용을 분석하여 체계적인 회의록으로 변환합니다.
              </p>
              <button
                onClick={generateMinutes}
                disabled={!apiKeys.gemini}
                className="px-6 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {apiKeys.gemini ? "회의록 생성하기" : "Gemini API 키 필요"}
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-zinc-400 text-sm">회의록을 생성하고 있습니다...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-4">
              <p className="text-red-400 text-sm">{error}</p>
              <button
                onClick={generateMinutes}
                className="mt-2 px-4 py-1.5 rounded bg-red-800 hover:bg-red-700 text-red-200 text-xs transition-colors"
              >
                다시 시도
              </button>
            </div>
          )}

          {minutes && (
            <div className="prose prose-invert prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-zinc-200 text-sm leading-relaxed">
                {minutes}
              </div>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        {minutes && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800">
            <button
              onClick={generateMinutes}
              className="px-4 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors"
            >
              다시 생성
            </button>
            <button
              onClick={copyToClipboard}
              className="px-4 py-1.5 rounded bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors"
            >
              클립보드에 복사
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
