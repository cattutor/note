"use client";

// ============================================================
// App Providers — Context Provider 래퍼
// ============================================================

import React, { useReducer, useEffect } from "react";
import { AppContext, appReducer, initialState } from "@/store";
import { DEFAULT_SPEAKERS, DEFAULT_GLOSSARY } from "@/lib/constants";
import { v4 as uuid } from "uuid";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // 초기 데이터 로드
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
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}
