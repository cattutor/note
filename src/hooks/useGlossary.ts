"use client";

// ============================================================
// useGlossary — 용어집 관리 훅
// ============================================================

import { useCallback, useEffect } from "react";
import { useAppContext } from "@/store";
import type { GlossaryEntry } from "@/types";

export function useGlossary() {
  const { state, dispatch } = useAppContext();

  /** 초기 로드 */
  useEffect(() => {
    fetchGlossary();
  }, []);

  const fetchGlossary = useCallback(async () => {
    try {
      const res = await fetch("/api/glossary");
      const json = await res.json();
      if (json.success) {
        dispatch({ type: "SET_GLOSSARY", payload: json.data });
      }
    } catch {
      // 네트워크 오류 무시 — 오프라인에서도 동작
    }
  }, [dispatch]);

  const addEntry = useCallback(
    async (source: string, target: string, context?: string) => {
      try {
        const res = await fetch("/api/glossary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source, target, context }),
        });
        const json = await res.json();
        if (json.success) {
          dispatch({ type: "ADD_GLOSSARY_ENTRY", payload: json.data });
          return json.data as GlossaryEntry;
        }
      } catch {
        // 오류 무시
      }
      return null;
    },
    [dispatch]
  );

  const removeEntry = useCallback(
    async (id: string) => {
      try {
        await fetch("/api/glossary", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        dispatch({ type: "REMOVE_GLOSSARY_ENTRY", payload: id });
      } catch {
        // 오류 무시
      }
    },
    [dispatch]
  );

  return {
    glossary: state.glossary,
    addEntry,
    removeEntry,
    fetchGlossary,
  };
}
