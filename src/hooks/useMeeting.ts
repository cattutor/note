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
import { SPEAKER_COLORS } from "@/lib/constants";

export function useMeeting() {
  const { state, dispatch } = useAppContext();
  const demoRef = useRef<DemoController | null>(null);
  const sttRef = useRef<STTController | null>(null);
  const [partialUtterance, setPartialUtterance] = useState<Utterance | null>(null);
  const [mode, setMode] = useState<"idle" | "demo" | "live">("idle");
  const [sttStatus, setSttStatus] = useState<string>("");

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
  const startLive = useCallback(async () => {
    if (!state.currentSession) {
      startSession("라이브 회의");
    }
    dispatch({ type: "SET_RECORDING", payload: true });
    setMode("live");

    let currentPartialId = uuid();
    let lastSpeakerId = "";
    let lastUtteranceTime = 0;
    let speakerCount = 0;

    // STT 언어 설정: sourceLanguage에 따라 결정
    const sttLang = state.settings.sourceLanguage === "ko" ? "ko-KR" : "en-US";
    setSttStatus(`STT 시작 중... (${sttLang})`);

    // 3초 이상 침묵 후 발화 → 화자 변경으로 추정
    const SILENCE_THRESHOLD_MS = 3000;

    function getOrCreateSpeaker(): Speaker {
      const now = Date.now();
      const silenceGap = now - lastUtteranceTime;

      // 첫 발화 또는 긴 침묵 → 화자 전환
      if (!lastSpeakerId || (lastUtteranceTime > 0 && silenceGap > SILENCE_THRESHOLD_MS)) {
        speakerCount++;
        const idx = (speakerCount - 1) % SPEAKER_COLORS.length;

        // 기존 등록된 화자가 있으면 순환
        if (state.speakers.length > 0) {
          const speaker = state.speakers[(speakerCount - 1) % state.speakers.length];
          lastSpeakerId = speaker.id;
          lastUtteranceTime = now;
          return speaker;
        }

        // 자동 화자 생성
        const newSpeaker: Speaker = {
          id: `live-speaker-${speakerCount}`,
          name: `화자 ${speakerCount}`,
          color: SPEAKER_COLORS[idx],
        };
        dispatch({ type: "ADD_SPEAKER", payload: newSpeaker });
        lastSpeakerId = newSpeaker.id;
        lastUtteranceTime = now;
        return newSpeaker;
      }

      // 짧은 침묵 → 같은 화자 유지
      lastUtteranceTime = now;
      const existing = state.speakers.find((s) => s.id === lastSpeakerId);
      return existing || { id: lastSpeakerId, name: "화자", color: SPEAKER_COLORS[0] };
    }

    const stt = new STTController({
      onPartialResult: (text: string) => {
        setSttStatus(`인식 중: "${text.slice(0, 30)}..."`);
        const speaker = getOrCreateSpeaker();
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

      onFinalResult: async (text: string, _audioBlob?: Blob) => {
        setSttStatus(`번역 중: "${text.slice(0, 30)}..."`);
        setPartialUtterance(null);

        const speaker = getOrCreateSpeaker();

        // 번역 수행
        const glossary = getGlossary();
        const result = await translateText(
          text,
          state.settings.context,
          glossary,
          state.settings.showTranslatorNotes,
          state.settings.apiKeys
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
        setSttStatus(`오류: ${error}`);
      },

      onEnd: () => {
        // 자동 재시작은 STTController 내부에서 처리
      },
    }, sttLang, false);

    sttRef.current = stt;
    const started = await stt.start();
    if (started) {
      setSttStatus(`대기 중 — ${sttLang === "ko-KR" ? "한국어" : "영어"}로 말씀하세요`);
    } else {
      setSttStatus("STT 시작 실패 — Chrome 브라우저를 사용하세요");
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
    setSttStatus("");
  }, [dispatch]);

  return {
    session: state.currentSession,
    isRecording: state.isRecording,
    partialUtterance,
    mode,
    sttStatus,
    startSession,
    startDemo,
    startLive,
    stopRecording,
    clearSession,
  };
}
