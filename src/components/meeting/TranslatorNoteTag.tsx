"use client";

import React, { useState } from "react";
import type { TranslatorNote } from "@/types";

interface TranslatorNoteTagProps {
  notes: TranslatorNote[];
}

export function TranslatorNoteTag({ notes }: TranslatorNoteTagProps) {
  const [expanded, setExpanded] = useState(false);

  if (notes.length === 0) return null;

  return (
    <div className="mt-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
      >
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>역자 주 ({notes.length})</span>
        <svg
          className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {expanded && (
        <div className="mt-1.5 space-y-1">
          {notes.map((note, i) => (
            <div
              key={i}
              className="text-xs bg-amber-400/10 border border-amber-400/20 rounded px-2.5 py-1.5 text-amber-200"
            >
              <span className="font-medium text-amber-400">
                &ldquo;{note.phrase}&rdquo;
              </span>{" "}
              &rarr; {note.explanation}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
