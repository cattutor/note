"use client";

// ============================================================
// App Providers — Context Provider 래퍼
// Settings + API 키를 localStorage에 영구 저장
// ============================================================

import React, { useReducer, useEffect, useRef } from "react";
import { AppContext, appReducer, initialState } from "@/store";
import { DEFAULT_SPEAKERS, DEFAULT_GLOSSARY, DEFAULT_SETTINGS } from "@/lib/constants";
import { v4 as uuid } from "uuid";
import type { AppSettings } from "@/types";

const STORAGE_KEY = "voiceprint-note-settings";

function loadSettings(): Partial<AppSettings> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveSettings(settings: AppSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // quota exceeded 등 무시
  }
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const initialized = useRef(false);

  // 초기 데이터 로드 (+ localStorage에서 설정 복원)
  useEffect(() => {
    dispatch({ type: "SET_SPEAKERS", payload: DEFAULT_SPEAKERS });
    dispatch({
      type: "SET_GLOSSARY",
      payload: DEFAULT_GLOSSARY.map((g) => ({
        id: uuid(),
        source: g.source,
        target: g.target,
        context: g.context,
        createdAt: Date.now(),
      })),
    });

    // localStorage에서 설정 복원
    const saved = loadSettings();
    if (saved) {
      dispatch({
        type: "SET_SETTINGS",
        payload: {
          ...DEFAULT_SETTINGS,
          ...saved,
          apiKeys: { ...DEFAULT_SETTINGS.apiKeys, ...saved.apiKeys },
        },
      });
    }

    initialized.current = true;
  }, []);

  // 설정 변경 시 localStorage에 저장
  useEffect(() => {
    if (initialized.current) {
      saveSettings(state.settings);
    }
  }, [state.settings]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}
