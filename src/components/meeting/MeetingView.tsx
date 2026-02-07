"use client";

// ============================================================
// MeetingView — 메인 회의 뷰 (모든 컴포넌트 통합)
// ============================================================

import React, { useState } from "react";
import { useAppContext } from "@/store";
import { useMeeting } from "@/hooks/useMeeting";
import { useGlossary } from "@/hooks/useGlossary";
import { MeetingHeader } from "./MeetingHeader";
import { SpeakerList } from "./SpeakerList";
import { EmptyState } from "./EmptyState";
import { SubtitleView } from "@/components/interpreter/SubtitleView";
import { ScriptView } from "@/components/interpreter/ScriptView";
import { GlossaryPanel } from "@/components/glossary/GlossaryPanel";
import { SettingsPanel } from "./SettingsPanel";
import type { AppSettings, InterpreterViewMode } from "@/types";

export function MeetingView() {
  const { state, dispatch } = useAppContext();
  const {
    session,
    isRecording,
    partialUtterance,
    mode,
    sttStatus,
    startDemo,
    startLive,
    stopRecording,
    clearSession,
  } = useMeeting();
  const { glossary, addEntry, removeEntry } = useGlossary();

  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { settings, speakers } = state;
  const utterances = session?.utterances || [];

  const handleViewModeChange = (mode: InterpreterViewMode) => {
    dispatch({ type: "SET_SETTINGS", payload: { viewMode: mode } });
  };

  const handleSettingsUpdate = (updates: Partial<AppSettings>) => {
    dispatch({ type: "SET_SETTINGS", payload: updates });
  };

  const showEmpty =
    !session || (utterances.length === 0 && !partialUtterance && !isRecording);

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <MeetingHeader
        isRecording={isRecording}
        recordingMode={mode}
        viewMode={settings.viewMode}
        sessionTitle={session?.title || ""}
        onStartDemo={startDemo}
        onStartLive={startLive}
        onStopRecording={stopRecording}
        onClearSession={clearSession}
        onViewModeChange={handleViewModeChange}
        onOpenGlossary={() => setGlossaryOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {session && <SpeakerList speakers={speakers} utterances={utterances} />}

      {/* STT 상태 표시 바 */}
      {mode === "live" && sttStatus && (
        <div className="bg-zinc-900/80 border-b border-zinc-800 px-5 py-1.5 text-xs text-yellow-400 flex items-center gap-2">
          <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
          {sttStatus}
        </div>
      )}

      <main className="flex-1 overflow-hidden">
        {showEmpty ? (
          <EmptyState onStartDemo={startDemo} onStartLive={startLive} />
        ) : settings.viewMode === "subtitle" ? (
          <SubtitleView
            utterances={utterances}
            speakers={speakers}
            partialUtterance={partialUtterance}
            showOriginal={settings.showOriginal}
            showTranslation={settings.showTranslation}
            showNotes={settings.showTranslatorNotes}
          />
        ) : (
          <ScriptView
            utterances={utterances}
            speakers={speakers}
            partialUtterance={partialUtterance}
            showNotes={settings.showTranslatorNotes}
          />
        )}
      </main>

      {session && (
        <footer className="bg-zinc-900 border-t border-zinc-800 px-5 py-2 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-4">
            <span>발화 {utterances.length}개</span>
            <span>화자 {speakers.length}명</span>
            <span>용어집 {glossary.length}개</span>
          </div>
          <div className="flex items-center gap-3">
            <span>컨텍스트: {settings.context}</span>
            <span>STT: {settings.sourceLanguage === "ko" ? "한국어" : "영어"}</span>
            <span>번역: {settings.apiKeys.gemini ? "Gemini" : settings.apiKeys.deepL ? "DeepL" : "Built-in"}</span>
            <span
              className={`flex items-center gap-1 ${
                isRecording ? "text-red-400" : "text-zinc-600"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isRecording ? "bg-red-500 animate-pulse" : "bg-zinc-700"
                }`}
              />
              {isRecording
                ? mode === "live" ? "라이브 녹음 중" : "데모 재생 중"
                : "대기"}
            </span>
          </div>
        </footer>
      )}

      <GlossaryPanel
        glossary={glossary}
        isOpen={glossaryOpen}
        onClose={() => setGlossaryOpen(false)}
        onAdd={addEntry}
        onRemove={removeEntry}
      />

      <SettingsPanel
        settings={settings}
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onUpdate={handleSettingsUpdate}
      />
    </div>
  );
}
