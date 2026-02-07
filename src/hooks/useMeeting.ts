"use client";

// ============================================================
// useMeeting — 회의 세션 관리 훅 (데모 + 라이브 모드)
// ============================================================

import { useCallback, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import type { MeetingSession, Utterance, Speaker } from "@/types";
import { useAppContext } from "@/store";
import { createDemoController, type DemoController } from "@/services/demo";
import { STTController } from "@/services/stt";
import { translateText } from "@/services/translation";
import { getGlossary } from "@/services/glossary";
import { fallbackIdentify } from "@/services/elevenLabs";

export function useMeeting() {
  const { state, dispatch } = useAppContext();
  const demoRef = useRef<DemoController | null>(null);
  const sttRef = useRef<STTController | null>(null);
  const [partialUtterance, setPartialUtterance] = useState<Utterance | null>(null);
  const [mode, setMode] = useState<"idle" | "demo" | "live">("idle");

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
    setMode("demo");

    const controller = createDemoController(
      (utterance) => setPartialUtterance(utterance),
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

  /** 라이브 녹음 모드 시작 (실제 마이크 입력) */
  const startLive = useCallback(() => {
    if (!state.currentSession) {
      startSession("라이브 회의");
    }
    dispatch({ type: "SET_RECORDING", payload: true });
    setMode("live");

    let currentPartialId = uuid();
    const speakers = state.speakers.length > 0 ? state.speakers : [];

    const stt = new STTController({
      onPartialResult: (text: string) => {
        const { speaker } = fallbackIdentify(speakers);
        const partial: Utterance = {
          id: currentPartialId,
          speakerId: speaker.id,
          originalText: text,
          translatedText: "",
          language: "en",
          timestamp: Date.now(),
          isPartial: true,
        };
        setPartialUtterance(partial);
      },

      onFinalResult: async (text: string) => {
        setPartialUtterance(null);

        // 화자 식별
        const { speaker } = fallbackIdentify(speakers);

        // 번역 수행
        const glossary = getGlossary();
        const result = await translateText(
          text,
          state.settings.context,
          glossary,
          state.settings.showTranslatorNotes
        );

        const utterance: Utterance = {
          id: currentPartialId,
          speakerId: speaker.id,
          originalText: text,
          translatedText: result.translatedText,
          language: "en",
          timestamp: Date.now(),
          isPartial: false,
          translatorNotes: result.notes.length > 0 ? result.notes : undefined,
        };

        dispatch({ type: "ADD_UTTERANCE", payload: utterance });
        currentPartialId = uuid();
      },

      onError: (error: string) => {
        console.error("STT Error:", error);
      },

      onEnd: () => {
        // 자동 재시작은 STTController 내부에서 처리
      },
    }, "en-US");

    sttRef.current = stt;
    const started = stt.start();
    if (!started) {
      dispatch({ type: "SET_RECORDING", payload: false });
      setMode("idle");
    }
  }, [state.currentSession, state.speakers, state.settings, dispatch, startSession]);

  /** 녹음/데모 중지 */
  const stopRecording = useCallback(() => {
    demoRef.current?.stop();
    demoRef.current = null;
    sttRef.current?.stop();
    sttRef.current = null;
    dispatch({ type: "SET_RECORDING", payload: false });
    setPartialUtterance(null);
    setMode("idle");
  }, [dispatch]);

  /** 세션 초기화 */
  const clearSession = useCallback(() => {
    demoRef.current?.stop();
    demoRef.current = null;
    sttRef.current?.stop();
    sttRef.current = null;
    dispatch({ type: "CLEAR_SESSION" });
    setPartialUtterance(null);
    setMode("idle");
  }, [dispatch]);

  return {
    session: state.currentSession,
    isRecording: state.isRecording,
    partialUtterance,
    mode,
    startSession,
    startDemo,
    startLive,
    stopRecording,
    clearSession,
  };
}
