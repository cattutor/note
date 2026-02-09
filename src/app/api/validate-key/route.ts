// ============================================================
// /api/validate-key — API 키 검증 엔드포인트
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { service, apiKey } = await request.json();

    if (!service || !apiKey) {
      return NextResponse.json(
        { success: false, error: "service와 apiKey가 필요합니다." } satisfies ApiResponse<never>,
        { status: 400 }
      );
    }

    let valid = false;
    let info = "";

    switch (service) {
      case "elevenLabs": {
        try {
          // Try multiple endpoints — sk_ keys with restricted scope may block some
          const endpoints = [
            { url: "https://api.elevenlabs.io/v1/user", label: "user" },
            { url: "https://api.elevenlabs.io/v1/voices", label: "voices" },
            { url: "https://api.elevenlabs.io/v1/models", label: "models" },
          ];

          for (const ep of endpoints) {
            const res = await fetch(ep.url, {
              headers: { "xi-api-key": apiKey },
            });
            if (res.ok) {
              valid = true;
              if (ep.label === "user") {
                const data = await res.json();
                info = `${data.subscription?.tier || "Free"} plan`;
              } else if (ep.label === "voices") {
                const data = await res.json();
                info = `Connected (${data.voices?.length || 0} voices)`;
              } else {
                info = "API key valid";
              }
              break;
            }
            // 401 = invalid key entirely, stop trying
            if (res.status === 401) {
              valid = false;
              info = "API 키가 유효하지 않습니다. 키를 다시 확인해주세요.";
              break;
            }
            // 403 = scope restricted, try next endpoint
          }

          if (!valid && !info) {
            info = "모든 엔드포인트 접근 거부됨. 키 권한을 Unrestricted로 설정해주세요.";
          }
        } catch (e) {
          valid = false;
          info = `Network error: ${e instanceof Error ? e.message : "연결 실패"}`;
        }
        break;
      }
      case "deepL": {
        try {
          // Try free API first, then pro API
          let res = await fetch(
            "https://api-free.deepl.com/v2/usage",
            { headers: { Authorization: `DeepL-Auth-Key ${apiKey}` } }
          );
          if (!res.ok && res.status === 403) {
            // Try pro endpoint
            res = await fetch(
              "https://api.deepl.com/v2/usage",
              { headers: { Authorization: `DeepL-Auth-Key ${apiKey}` } }
            );
          }
          valid = res.ok;
          if (valid) {
            const data = await res.json();
            info = `${data.character_count || 0} / ${data.character_limit || 0} chars used`;
          } else {
            info = `HTTP ${res.status}: ${res.status === 403 ? "Invalid API key" : res.statusText}`;
          }
        } catch (e) {
          valid = false;
          info = `Network error: ${e instanceof Error ? e.message : "연결 실패"}`;
        }
        break;
      }
      case "gemini": {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
          );
          valid = res.ok;
          if (valid) {
            info = "API key valid";
          } else {
            info = `HTTP ${res.status}: ${res.status === 400 ? "Invalid API key" : res.statusText}`;
          }
        } catch (e) {
          valid = false;
          info = `Network error: ${e instanceof Error ? e.message : "연결 실패"}`;
        }
        break;
      }
      default:
        return NextResponse.json(
          { success: false, error: "알 수 없는 서비스입니다." } satisfies ApiResponse<never>,
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: { valid, info },
    } satisfies ApiResponse<{ valid: boolean; info: string }>);
  } catch {
    return NextResponse.json(
      { success: false, error: "검증 실패" } satisfies ApiResponse<never>,
      { status: 500 }
    );
  }
}
