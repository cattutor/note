"use client";

// ============================================================
// Meeting Header — 회의 제어 헤더
// ============================================================

import React from "react";
import { Button } from "@/components/ui/Button";
import type { InterpreterViewMode } from "@/types";

interface MeetingHeaderProps {
  isRecording: boolean;
  viewMode: InterpreterViewMode;
  sessionTitle: string;
  onStartDemo: () => void;
  onStopRecording: () => void;
  onClearSession: () => void;
  onViewModeChange: (mode: InterpreterViewMode) => void;
  onOpenGlossary: () => void;
  onOpenSettings: () => void;
}

export function MeetingHeader({
  isRecording,
  viewMode,
  sessionTitle,
  onStartDemo,
  onStopRecording,
  onClearSession,
  onViewModeChange,
  onOpenGlossary,
  onOpenSettings,
}: MeetingHeaderProps) {
  return (
    <header className="bg-zinc-900 border-b border-zinc-800 px-5 py-3">
      <div className="flex items-center justify-between">
        {/* 왼쪽: 로고 & 세션 정보 */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-zinc-100">VoicePrint Note</h1>
              <p className="text-[10px] text-zinc-500">화자 식별 & 실시간 통역</p>
            </div>
          </div>

          {sessionTitle && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-400">
              <span className="text-zinc-600">|</span>
              <span>{sessionTitle}</span>
              {isRecording && (
                <span className="flex items-center gap-1 text-red-400">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  REC
                </span>
              )}
            </div>
          )}
        </div>

        {/* 오른쪽: 컨트롤 */}
        <div className="flex items-center gap-2">
          {/* 뷰 모드 토글 */}
          <div className="hidden sm:flex items-center bg-zinc-800 rounded-lg p-0.5">
            <button
              onClick={() => onViewModeChange("subtitle")}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                viewMode === "subtitle"
                  ? "bg-zinc-700 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              자막형
            </button>
            <button
              onClick={() => onViewModeChange("script")}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                viewMode === "script"
                  ? "bg-zinc-700 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              대본형
            </button>
          </div>

          <Button variant="ghost" size="sm" onClick={onOpenGlossary} title="용어집">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </Button>

          <Button variant="ghost" size="sm" onClick={onOpenSettings} title="설정">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Button>

          {/* 녹음 컨트롤 */}
          {isRecording ? (
            <Button variant="danger" size="sm" onClick={onStopRecording}>
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
              중지
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={onStartDemo}>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              데모 시작
            </Button>
          )}

          {(isRecording || sessionTitle) && (
            <Button variant="ghost" size="sm" onClick={onClearSession} title="세션 초기화">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
