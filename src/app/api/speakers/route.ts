// ============================================================
// /api/speakers — 화자 관리 API
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import {
  getRegisteredSpeakers,
  registerSpeaker,
  removeSpeaker,
} from "@/services/voiceId";
import type { ApiResponse, Speaker } from "@/types";

/** GET — 등록된 화자 목록 */
export async function GET() {
  const speakers = getRegisteredSpeakers();
  return NextResponse.json({
    success: true,
    data: speakers,
  } satisfies ApiResponse<Speaker[]>);
}

/** POST — 화자 등록/수정 */
export async function POST(request: NextRequest) {
  try {
    const speaker = (await request.json()) as Speaker;
    if (!speaker.id || !speaker.name) {
      return NextResponse.json(
        { success: false, error: "id와 name이 필요합니다." } satisfies ApiResponse<never>,
        { status: 400 }
      );
    }

    registerSpeaker(speaker);
    return NextResponse.json({
      success: true,
      data: speaker,
    } satisfies ApiResponse<Speaker>);
  } catch {
    return NextResponse.json(
      { success: false, error: "화자 등록 실패" } satisfies ApiResponse<never>,
      { status: 500 }
    );
  }
}

/** DELETE — 화자 삭제 */
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json(
        { success: false, error: "id가 필요합니다." } satisfies ApiResponse<never>,
        { status: 400 }
      );
    }

    const removed = removeSpeaker(id);
    return NextResponse.json({
      success: true,
      data: removed,
    } satisfies ApiResponse<boolean>);
  } catch {
    return NextResponse.json(
      { success: false, error: "화자 삭제 실패" } satisfies ApiResponse<never>,
      { status: 500 }
    );
  }
}
