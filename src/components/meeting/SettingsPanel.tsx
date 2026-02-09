"use client";

// ============================================================
// Settings Panel — 설정 사이드 패널
// ============================================================

import React, { useState, useCallback } from "react";
import type { AppSettings, ApiKeys } from "@/types";
import { TRANSLATION_CONTEXTS } from "@/lib/constants";

/** Client-side direct API validation (avoids server-side fetch issues) */
async function validateClientSide(
  service: string,
  apiKey: string
): Promise<{ info: string } | null> {
  switch (service) {
    case "elevenLabs": {
      const endpoints = [
        "https://api.elevenlabs.io/v1/user",
        "https://api.elevenlabs.io/v1/voices",
        "https://api.elevenlabs.io/v1/models",
      ];
      for (const url of endpoints) {
        try {
          const res = await fetch(url, {
            headers: { "xi-api-key": apiKey },
          });
          if (res.ok) {
            if (url.includes("/user")) {
              const data = await res.json();
              return { info: `${data.subscription?.tier || "Free"} plan` };
            }
            if (url.includes("/voices")) {
              const data = await res.json();
              return { info: `Connected (${data.voices?.length || 0} voices)` };
            }
            return { info: "API key valid" };
          }
          if (res.status === 401) return null;
        } catch {
          // CORS blocked — throw to trigger server fallback
          throw new Error("CORS");
        }
      }
      return null;
    }
    case "gemini": {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );
      if (res.ok) return { info: "API key valid" };
      return null;
    }
    case "deepL": {
      // DeepL blocks CORS, skip client-side
      throw new Error("CORS");
    }
    default:
      return null;
  }
}

/** Basic key format check when network validation is unavailable */
function checkKeyFormat(service: string, key: string): boolean {
  switch (service) {
    case "elevenLabs":
      return key.length >= 20; // sk_ keys or legacy keys
    case "gemini":
      return key.startsWith("AIza") && key.length >= 30;
    case "deepL":
      return key.length >= 20;
    default:
      return key.length > 0;
  }
}

interface SettingsPanelProps {
  settings: AppSettings;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updates: Partial<AppSettings>) => void;
}

export function SettingsPanel({
  settings,
  isOpen,
  onClose,
  onUpdate,
}: SettingsPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm bg-zinc-900 border-l border-zinc-800 flex flex-col animate-slide-in-right">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="text-base font-bold text-zinc-100">설정</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {/* 표시 옵션 */}
          <section>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              표시 옵션
            </h3>
            <div className="space-y-3">
              <ToggleItem
                label="원문 표시"
                description="영어 원문 텍스트 표시"
                checked={settings.showOriginal}
                onChange={(v) => onUpdate({ showOriginal: v })}
              />
              <ToggleItem
                label="번역문 표시"
                description="한국어 번역 텍스트 표시"
                checked={settings.showTranslation}
                onChange={(v) => onUpdate({ showTranslation: v })}
              />
              <ToggleItem
                label="역자 주 표시"
                description="관용구/뉘앙스 설명 노트"
                checked={settings.showTranslatorNotes}
                onChange={(v) => onUpdate({ showTranslatorNotes: v })}
              />
            </div>
          </section>

          {/* 번역 컨텍스트 */}
          <section>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              번역 컨텍스트
            </h3>
            <p className="text-xs text-zinc-600 mb-2">
              번역 엔진에 전달할 맥락 정보를 선택합니다.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {TRANSLATION_CONTEXTS.map((ctx) => (
                <button
                  key={ctx}
                  onClick={() => onUpdate({ context: ctx })}
                  className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                    settings.context === ctx
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                  }`}
                >
                  {ctx}
                </button>
              ))}
            </div>
          </section>

          {/* 뷰 모드 */}
          <section>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              뷰 모드
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <ViewModeCard
                title="자막형"
                description="넷플릭스 자막 스타일"
                icon="subtitle"
                active={settings.viewMode === "subtitle"}
                onClick={() => onUpdate({ viewMode: "subtitle" })}
              />
              <ViewModeCard
                title="대본형"
                description="좌우 분할 스크립트"
                icon="script"
                active={settings.viewMode === "script"}
                onClick={() => onUpdate({ viewMode: "script" })}
              />
            </div>
          </section>

          {/* API 키 설정 */}
          <section>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              API 키 설정
            </h3>
            <p className="text-xs text-zinc-600 mb-3">
              API 키를 입력하면 실제 서비스와 연동됩니다. 키는 브라우저에만 저장됩니다.
            </p>
            <div className="space-y-3">
              <ApiKeyInput
                label="ElevenLabs"
                description="화자 식별 (Voice ID)"
                value={settings.apiKeys.elevenLabs || ""}
                service="elevenLabs"
                placeholder="xi_..."
                onChange={(v) =>
                  onUpdate({ apiKeys: { ...settings.apiKeys, elevenLabs: v || undefined } })
                }
              />
              <ApiKeyInput
                label="DeepL"
                description="고품질 번역 엔진"
                value={settings.apiKeys.deepL || ""}
                service="deepL"
                placeholder="xxxxxxxx-xxxx-..."
                onChange={(v) =>
                  onUpdate({ apiKeys: { ...settings.apiKeys, deepL: v || undefined } })
                }
              />
              <ApiKeyInput
                label="Gemini"
                description="맥락 인식 LLM 번역"
                value={settings.apiKeys.gemini || ""}
                service="gemini"
                placeholder="AIza..."
                onChange={(v) =>
                  onUpdate({ apiKeys: { ...settings.apiKeys, gemini: v || undefined } })
                }
              />
            </div>
          </section>

          {/* 기술 스택 정보 */}
          <section>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              기술 정보
            </h3>
            <div className="bg-zinc-800/50 rounded-lg p-3 space-y-2 text-xs text-zinc-500">
              <div className="flex justify-between">
                <span>Translation Engine</span>
                <span className="text-zinc-300">
                  {settings.apiKeys.deepL ? "DeepL Pro" : settings.apiKeys.gemini ? "Gemini 1.5" : "Built-in"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Voice ID</span>
                <span className="text-zinc-300">
                  {settings.apiKeys.elevenLabs ? (
                    <span className="text-emerald-400">ElevenLabs (Active)</span>
                  ) : "ElevenLabs (Sim)"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>STT</span>
                <span className="text-zinc-300">Web Speech API</span>
              </div>
              <div className="flex justify-between">
                <span>Glossary DB</span>
                <span className="text-zinc-300">In-Memory (Redis Sim)</span>
              </div>
              <div className="flex justify-between">
                <span>Latency</span>
                <span className="text-zinc-300">WebSocket Stream</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function ToggleItem({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-zinc-200">{label}</p>
        <p className="text-xs text-zinc-600">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${
          checked ? "bg-blue-600" : "bg-zinc-700"
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function ApiKeyInput({
  label,
  description,
  value,
  service,
  placeholder,
  onChange,
}: {
  label: string;
  description: string;
  value: string;
  service: string;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [statusInfo, setStatusInfo] = useState("");

  const validate = useCallback(async () => {
    if (!value.trim()) return;
    setStatus("checking");
    setStatusInfo("");
    const key = value.trim();

    // 1) Try client-side direct validation
    try {
      const result = await validateClientSide(service, key);
      if (result) {
        setStatus("valid");
        setStatusInfo(result.info);
        return;
      }
      // result === null means key was explicitly rejected (e.g. 401)
      setStatus("invalid");
      setStatusInfo("API 키가 유효하지 않습니다.");
      return;
    } catch {
      // Client-side failed (CORS/network), try server fallback
    }

    // 2) Try server-side validation
    try {
      const res = await fetch("/api/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service, apiKey: key }),
      });
      const json = await res.json();
      if (json.data?.valid) {
        setStatus("valid");
        setStatusInfo(json.data.info || "");
        return;
      }
      // Check if it's a network error on server side too
      const serverInfo: string = json.data?.info || "";
      if (!serverInfo.includes("Network error")) {
        setStatus("invalid");
        setStatusInfo(serverInfo || json.error || "검증 실패");
        return;
      }
    } catch {
      // Server also failed
    }

    // 3) Both failed — accept key with format check
    const formatOk = checkKeyFormat(service, key);
    if (formatOk) {
      setStatus("valid");
      setStatusInfo("키 저장됨 (네트워크 문제로 원격 검증 불가, 사용 시 자동 검증)");
    } else {
      setStatus("invalid");
      setStatusInfo("키 형식이 올바르지 않습니다.");
    }
  }, [value, service]);

  const statusIcon = {
    idle: null,
    checking: (
      <span className="text-zinc-500 text-xs animate-pulse">...</span>
    ),
    valid: (
      <span className="text-emerald-400 text-xs" title={statusInfo}>OK</span>
    ),
    invalid: (
      <span className="text-red-400 text-xs cursor-help" title={statusInfo}>X</span>
    ),
  };

  return (
    <div className="bg-zinc-800/50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-1.5">
        <div>
          <span className="text-sm text-zinc-200 font-medium">{label}</span>
          <span className="text-xs text-zinc-600 ml-2">{description}</span>
        </div>
        {statusIcon[status]}
      </div>
      <div className="flex gap-1.5">
        <div className="relative flex-1">
          <input
            type={visible ? "text" : "password"}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setStatus("idle");
            }}
            placeholder={placeholder}
            className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono pr-8"
          />
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {visible ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              ) : (
                <>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </>
              )}
            </svg>
          </button>
        </div>
        <button
          onClick={validate}
          disabled={!value.trim() || status === "checking"}
          className="px-2.5 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs rounded disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          검증
        </button>
      </div>
      {status === "valid" && statusInfo && (
        <p className="text-[10px] text-emerald-400 mt-1">{statusInfo}</p>
      )}
      {status === "invalid" && statusInfo && (
        <p className="text-[10px] text-red-400 mt-1">{statusInfo}</p>
      )}
    </div>
  );
}

function ViewModeCard({
  title,
  description,
  icon,
  active,
  onClick,
}: {
  title: string;
  description: string;
  icon: "subtitle" | "script";
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-lg border text-left transition-colors ${
        active
          ? "border-blue-500 bg-blue-500/10"
          : "border-zinc-800 bg-zinc-800/50 hover:border-zinc-700"
      }`}
    >
      <div className="text-lg mb-1">{icon === "subtitle" ? "CC" : "||"}</div>
      <p className={`text-sm font-medium ${active ? "text-blue-400" : "text-zinc-300"}`}>
        {title}
      </p>
      <p className="text-xs text-zinc-600 mt-0.5">{description}</p>
    </button>
  );
}
