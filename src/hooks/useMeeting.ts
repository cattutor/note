"use client";

// ============================================================
// useMeeting — 회의 세션 관리 훅 (데모 + 라이브 모드)
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import type { MeetingSession, Utterance, Speaker } from "@/types";
import { useAppContext } from "@/store";
import { createDemoController, type DemoController } from "@/services/demo";
import { STTController } from "@/services/stt";
import { translateText, detectLanguage } from "@/services/translation";
import { getGlossary } from "@/services/glossary";
import { SPEAKER_COLORS } from "@/lib/constants";

export function useMeeting() {
  const { state, dispatch } = useAppContext();
  const demoRef = useRef<DemoController | null>(null);
  const sttRef = useRef<STTController | null>(null);
  const settingsRef = useRef(state.settings);
  const [partialUtterance, setPartialUtterance] = useState<Utterance | null>(null);
  const [mode, setMode] = useState<"idle" | "demo" | "live">("idle");
  const [sttStatus, setSttStatus] = useState<string>("");
  const [translationEnabled, setTranslationEnabled] = useState(false);

  // 항상 최신 settings를 ref에 유지 (stale closure 방지)
  settingsRef.current = state.settings;

  // 번역 토글 상태도 ref로 유지 (stale closure 방지)
  const translationEnabledRef = useRef(translationEnabled);
  translationEnabledRef.current = translationEnabled;

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
    let lastPartialText = ""; // 마지막 partial 텍스트 추적

    // STT 언어 설정: sourceLanguage에 따라 결정
    const sttLang = settingsRef.current.sourceLanguage === "ko" ? "ko-KR" : "en-US";
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
        const num = String(speakerCount).padStart(2, "0");
        const newSpeaker: Speaker = {
          id: `live-speaker-${speakerCount}`,
          name: `Speaker${num}`,
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
      return existing || { id: lastSpeakerId, name: "Speaker", color: SPEAKER_COLORS[0] };
    }

    /** partial 또는 final 텍스트를 utterance로 커밋 */
    async function commitUtterance(text: string) {
      if (!text.trim()) return;

      const detectedLang = detectLanguage(text);
      const speaker = getOrCreateSpeaker();
      const currentSettings = settingsRef.current;

      let translatedText = "";

      // 번역이 활성화된 경우에만 번역 수행
      if (translationEnabledRef.current) {
        const glossary = getGlossary();
        const direction = detectedLang === "ko" ? "ko→en" as const : "en→ko" as const;
        setSttStatus(`번역 중 (${detectedLang === "ko" ? "한→영" : "영→한"}): "${text.slice(0, 30)}..."`);

        const result = await translateText(
          text,
          currentSettings.context,
          glossary,
          currentSettings.showTranslatorNotes,
          currentSettings.apiKeys,
          direction
        );
        translatedText = result.translatedText;

        const utterance: Utterance = {
          id: currentPartialId,
          speakerId: speaker.id,
          originalText: text,
          translatedText,
          language: detectedLang,
          timestamp: Date.now(),
          isPartial: false,
          translatorNotes: result.notes.length > 0 ? result.notes : undefined,
        };
        dispatch({ type: "ADD_UTTERANCE", payload: utterance });
      } else {
        // 번역 없이 원문만 기록
        const utterance: Utterance = {
          id: currentPartialId,
          speakerId: speaker.id,
          originalText: text,
          translatedText: "",
          language: detectedLang,
          timestamp: Date.now(),
          isPartial: false,
        };
        dispatch({ type: "ADD_UTTERANCE", payload: utterance });
      }

      currentPartialId = uuid();
      lastPartialText = "";
    }

    const stt = new STTController({
      onPartialResult: (text: string) => {
        lastPartialText = text;
        const detectedLang = detectLanguage(text);
        setSttStatus(`인식 중 (${detectedLang === "ko" ? "한국어" : "영어"}): "${text.slice(0, 30)}..."`);
        // partial에서는 화자 변경 판단하지 않음 (side effect 방지)
        const currentSpeaker = lastSpeakerId
          ? (state.speakers.find((s) => s.id === lastSpeakerId) || { id: lastSpeakerId, name: "Speaker", color: SPEAKER_COLORS[0] })
          : { id: "pending", name: "Speaker01", color: SPEAKER_COLORS[0] };
        const partial: Utterance = {
          id: currentPartialId,
          speakerId: currentSpeaker.id,
          originalText: text,
          translatedText: "",
          language: detectedLang,
          timestamp: Date.now(),
          isPartial: true,
        };
        setPartialUtterance(partial);
      },

      onFinalResult: async (text: string, _audioBlob?: Blob) => {
        setPartialUtterance(null);
        lastPartialText = "";
        await commitUtterance(text);
        const lang = settingsRef.current.sourceLanguage === "ko" ? "한국어" : "영어";
        setSttStatus(`대기 중 — ${lang}로 말씀하세요`);
      },

      onError: (error: string) => {
        console.error("STT Error:", error);
        setSttStatus(`오류: ${error}`);
      },

      onEnd: () => {
        // STT가 종료될 때 미완성 partial이 있으면 커밋
        if (lastPartialText.trim()) {
          const pendingText = lastPartialText;
          lastPartialText = "";
          setPartialUtterance(null);
          commitUtterance(pendingText);
        }
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

  /** 번역 토글 */
  const toggleTranslation = useCallback(() => {
    setTranslationEnabled((prev) => !prev);
  }, []);

  // 라이브 중 sourceLanguage가 변경되면 STT 언어 재시작
  useEffect(() => {
    if (mode === "live" && sttRef.current) {
      const newLang = state.settings.sourceLanguage === "ko" ? "ko-KR" : "en-US";
      setSttStatus(`언어 전환 중... (${newLang})`);
      sttRef.current.setLanguage(newLang);
      setTimeout(() => {
        setSttStatus(`대기 중 — ${newLang === "ko-KR" ? "한국어" : "영어"}로 말씀하세요`);
      }, 500);
    }
  }, [state.settings.sourceLanguage, mode]);

  return {
    session: state.currentSession,
    isRecording: state.isRecording,
    partialUtterance,
    mode,
    sttStatus,
    translationEnabled,
    startSession,
    startDemo,
    startLive,
    stopRecording,
    clearSession,
    toggleTranslation,
  };
}
