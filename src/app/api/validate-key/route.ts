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
        const res = await fetch("https://api.elevenlabs.io/v1/user", {
          headers: { "xi-api-key": apiKey },
        });
        valid = res.ok;
        if (valid) {
          const data = await res.json();
          info = `${data.subscription?.tier || "Free"} plan`;
        }
        break;
      }
      case "deepL": {
        const res = await fetch(
          "https://api-free.deepl.com/v2/usage",
          { headers: { Authorization: `DeepL-Auth-Key ${apiKey}` } }
        );
        valid = res.ok;
        if (valid) {
          const data = await res.json();
          info = `${data.character_count || 0} / ${data.character_limit || 0} chars used`;
        }
        break;
      }
      case "gemini": {
        // Gemini API 검증은 간단한 요청으로 확인
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );
        valid = res.ok;
        if (valid) info = "API key valid";
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
