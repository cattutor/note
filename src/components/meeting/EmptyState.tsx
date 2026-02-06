"use client";

import React from "react";
import { Button } from "@/components/ui/Button";

interface EmptyStateProps {
  onStartDemo: () => void;
}

export function EmptyState({ onStartDemo }: EmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-lg">
        {/* 아이콘 */}
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500/20 to-violet-600/20 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/10">
          <svg
            className="w-10 h-10 text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-zinc-100 mb-2">
          VoicePrint Note
        </h2>
        <p className="text-zinc-400 text-sm mb-2">
          화자 식별 & 실시간 영-한 동시 통역
        </p>

        {/* 기능 소개 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 mb-8 text-left">
          <FeatureCard
            icon="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 0"
            title="화자 식별"
            desc="Voice Print 기반으로 누가 말하는지 자동 인식"
          />
          <FeatureCard
            icon="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
            title="실시간 통역"
            desc="영어 → 한국어 맥락 인식 번역"
          />
          <FeatureCard
            icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            title="용어집"
            desc="프로젝트 고유명사 사전 등록으로 오역 방지"
          />
        </div>

        <Button size="lg" onClick={onStartDemo}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          데모 회의 시작
        </Button>

        <p className="text-xs text-zinc-600 mt-4">
          데모 모드에서 가상 회의 시뮬레이션이 자동 실행됩니다.
        </p>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
      <svg
        className="w-5 h-5 text-blue-400 mb-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
      </svg>
      <p className="text-sm font-medium text-zinc-200">{title}</p>
      <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
    </div>
  );
}
