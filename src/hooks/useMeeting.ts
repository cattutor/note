"use client";

// ============================================================
// useMeeting — 회의 세션 관리 훅
// ============================================================

import { useCallback, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import type { MeetingSession, Utterance, Speaker } from "@/types";
import { useAppContext } from "@/store";
import { createDemoController, type DemoController } from "@/services/demo";

export function useMeeting() {
  const { state, dispatch } = useAppContext();
  const demoRef = useRef<DemoController | null>(null);
  const [partialUtterance, setPartialUtterance] = useState<Utterance | null>(null);

  /** 새 회의 세션 시작 */
  const startSession = useCallback(
    (title: string = "새 회의", speakers: Speaker[] = []) => {
      const session: MeetingSession = {
        id: uuid(),
        title,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        speakers,
        utterances: [],
        glossaryIds: [],
      };
      dispatch({ type: "SET_SESSION", payload: session });
      return session;
    },
    [dispatch]
  );

  /** 데모 모드 시작 */
  const startDemo = useCallback(() => {
    if (!state.currentSession) {
      startSession("데모 회의");
    }
    dispatch({ type: "SET_RECORDING", payload: true });

    const controller = createDemoController(
      // onPartial
      (utterance) => {
        setPartialUtterance(utterance);
      },
      // onFinal
      (utterance) => {
        setPartialUtterance(null);
        dispatch({ type: "ADD_UTTERANCE", payload: utterance });
      },
      state.speakers.length > 0 ? state.speakers : undefined,
      state.settings.context
    );

    demoRef.current = controller;
    controller.start();
  }, [state.currentSession, state.speakers, state.settings.context, dispatch, startSession]);

  /** 녹음/데모 중지 */
  const stopRecording = useCallback(() => {
    demoRef.current?.stop();
    demoRef.current = null;
    dispatch({ type: "SET_RECORDING", payload: false });
    setPartialUtterance(null);
  }, [dispatch]);

  /** 세션 초기화 */
  const clearSession = useCallback(() => {
    demoRef.current?.stop();
    demoRef.current = null;
    dispatch({ type: "CLEAR_SESSION" });
    setPartialUtterance(null);
  }, [dispatch]);

  return {
    session: state.currentSession,
    isRecording: state.isRecording,
    partialUtterance,
    startSession,
    startDemo,
    stopRecording,
    clearSession,
  };
}
