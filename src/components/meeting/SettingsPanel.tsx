"use client";

// ============================================================
// Settings Panel — 설정 사이드 패널
// ============================================================

import React from "react";
import type { AppSettings } from "@/types";
import { TRANSLATION_CONTEXTS } from "@/lib/constants";

interface SettingsPanelProps {
  settings: AppSettings;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updates: Partial<AppSettings>) => void;
}

export function SettingsPanel({
  settings,
  isOpen,
  onClose,
  onUpdate,
}: SettingsPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm bg-zinc-900 border-l border-zinc-800 flex flex-col animate-slide-in-right">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="text-base font-bold text-zinc-100">설정</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {/* 표시 옵션 */}
          <section>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              표시 옵션
            </h3>
            <div className="space-y-3">
              <ToggleItem
                label="원문 표시"
                description="영어 원문 텍스트 표시"
                checked={settings.showOriginal}
                onChange={(v) => onUpdate({ showOriginal: v })}
              />
              <ToggleItem
                label="번역문 표시"
                description="한국어 번역 텍스트 표시"
                checked={settings.showTranslation}
                onChange={(v) => onUpdate({ showTranslation: v })}
              />
              <ToggleItem
                label="역자 주 표시"
                description="관용구/뉘앙스 설명 노트"
                checked={settings.showTranslatorNotes}
                onChange={(v) => onUpdate({ showTranslatorNotes: v })}
              />
            </div>
          </section>

          {/* 번역 컨텍스트 */}
          <section>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              번역 컨텍스트
            </h3>
            <p className="text-xs text-zinc-600 mb-2">
              번역 엔진에 전달할 맥락 정보를 선택합니다.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {TRANSLATION_CONTEXTS.map((ctx) => (
                <button
                  key={ctx}
                  onClick={() => onUpdate({ context: ctx })}
                  className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                    settings.context === ctx
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                  }`}
                >
                  {ctx}
                </button>
              ))}
            </div>
          </section>

          {/* 뷰 모드 */}
          <section>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              뷰 모드
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <ViewModeCard
                title="자막형"
                description="넷플릭스 자막 스타일"
                icon="subtitle"
                active={settings.viewMode === "subtitle"}
                onClick={() => onUpdate({ viewMode: "subtitle" })}
              />
              <ViewModeCard
                title="대본형"
                description="좌우 분할 스크립트"
                icon="script"
                active={settings.viewMode === "script"}
                onClick={() => onUpdate({ viewMode: "script" })}
              />
            </div>
          </section>

          {/* 기술 스택 정보 */}
          <section>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              기술 정보
            </h3>
            <div className="bg-zinc-800/50 rounded-lg p-3 space-y-2 text-xs text-zinc-500">
              <div className="flex justify-between">
                <span>Translation Engine</span>
                <span className="text-zinc-300">LLM Context-Aware</span>
              </div>
              <div className="flex justify-between">
                <span>Voice ID</span>
                <span className="text-zinc-300">ElevenLabs (Sim)</span>
              </div>
              <div className="flex justify-between">
                <span>STT</span>
                <span className="text-zinc-300">Web Speech API</span>
              </div>
              <div className="flex justify-between">
                <span>Glossary DB</span>
                <span className="text-zinc-300">In-Memory (Redis Sim)</span>
              </div>
              <div className="flex justify-between">
                <span>Latency</span>
                <span className="text-zinc-300">WebSocket Stream</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function ToggleItem({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-zinc-200">{label}</p>
        <p className="text-xs text-zinc-600">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${
          checked ? "bg-blue-600" : "bg-zinc-700"
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function ViewModeCard({
  title,
  description,
  icon,
  active,
  onClick,
}: {
  title: string;
  description: string;
  icon: "subtitle" | "script";
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-lg border text-left transition-colors ${
        active
          ? "border-blue-500 bg-blue-500/10"
          : "border-zinc-800 bg-zinc-800/50 hover:border-zinc-700"
      }`}
    >
      <div className="text-lg mb-1">{icon === "subtitle" ? "CC" : "||"}</div>
      <p className={`text-sm font-medium ${active ? "text-blue-400" : "text-zinc-300"}`}>
        {title}
      </p>
      <p className="text-xs text-zinc-600 mt-0.5">{description}</p>
    </button>
  );
}
