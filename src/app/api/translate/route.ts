// ============================================================
// POST /api/translate — 번역 API
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { translateText } from "@/services/translation";
import { getGlossary } from "@/services/glossary";
import type { ApiResponse } from "@/types";
import type { TranslationResult } from "@/services/translation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      text,
      context = "게임 개발 회의",
      includeNotes = true,
    } = body as {
      text: string;
      context?: string;
      includeNotes?: boolean;
    };

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { success: false, error: "text 필드가 필요합니다." } satisfies ApiResponse<never>,
        { status: 400 }
      );
    }

    const glossary = getGlossary();
    const result = await translateText(text, context, glossary, includeNotes);

    return NextResponse.json({
      success: true,
      data: result,
    } satisfies ApiResponse<TranslationResult>);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "번역 오류",
      } satisfies ApiResponse<never>,
      { status: 500 }
    );
  }
}
