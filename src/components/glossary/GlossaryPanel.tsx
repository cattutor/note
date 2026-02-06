"use client";

// ============================================================
// Glossary Panel — 용어집 사이드 패널
// ============================================================

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { GlossaryEntry } from "@/types";

interface GlossaryPanelProps {
  glossary: GlossaryEntry[];
  isOpen: boolean;
  onClose: () => void;
  onAdd: (source: string, target: string, context?: string) => void;
  onRemove: (id: string) => void;
}

export function GlossaryPanel({
  glossary,
  isOpen,
  onClose,
  onAdd,
  onRemove,
}: GlossaryPanelProps) {
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [context, setContext] = useState("");
  const [search, setSearch] = useState("");

  const filtered = glossary.filter(
    (g) =>
      g.source.toLowerCase().includes(search.toLowerCase()) ||
      g.target.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (source.trim() && target.trim()) {
      onAdd(source.trim(), target.trim(), context.trim() || undefined);
      setSource("");
      setTarget("");
      setContext("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 패널 */}
      <div className="relative w-full max-w-md bg-zinc-900 border-l border-zinc-800 flex flex-col animate-slide-in-right">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-zinc-100">용어집</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Custom Glossary ({glossary.length}개 등록)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 용어 추가 폼 */}
        <div className="px-5 py-4 border-b border-zinc-800 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="원문 (영어)"
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="번역 (한국어)"
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="맥락 설명 (선택)"
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Button size="sm" onClick={handleAdd} disabled={!source || !target}>
              추가
            </Button>
          </div>
        </div>

        {/* 검색 */}
        <div className="px-5 py-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="용어 검색..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* 용어 목록 */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          <div className="space-y-1">
            {filtered.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-zinc-800/50 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-zinc-200 font-medium truncate">
                      {entry.source}
                    </span>
                    <svg className="w-3 h-3 text-zinc-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    <span className="text-blue-400 truncate">{entry.target}</span>
                  </div>
                  {entry.context && (
                    <p className="text-[11px] text-zinc-600 mt-0.5 truncate">
                      {entry.context}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onRemove(entry.id)}
                  className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all ml-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}

            {filtered.length === 0 && (
              <p className="text-center text-zinc-600 text-sm py-8">
                {search ? "검색 결과가 없습니다." : "등록된 용어가 없습니다."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
