// ============================================================
// /api/glossary — 용어집 CRUD API
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import {
  getGlossary,
  addGlossaryEntry,
  removeGlossaryEntry,
  updateGlossaryEntry,
} from "@/services/glossary";
import type { ApiResponse, GlossaryEntry } from "@/types";

/** GET — 전체 용어집 조회 */
export async function GET() {
  const glossary = getGlossary();
  return NextResponse.json({
    success: true,
    data: glossary,
  } satisfies ApiResponse<GlossaryEntry[]>);
}

/** POST — 용어 추가 */
export async function POST(request: NextRequest) {
  try {
    const { source, target, context } = await request.json();

    if (!source || !target) {
      return NextResponse.json(
        { success: false, error: "source와 target이 필요합니다." } satisfies ApiResponse<never>,
        { status: 400 }
      );
    }

    const entry = addGlossaryEntry(source, target, context);
    return NextResponse.json({
      success: true,
      data: entry,
    } satisfies ApiResponse<GlossaryEntry>);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "용어 추가 실패" } satisfies ApiResponse<never>,
      { status: 500 }
    );
  }
}

/** DELETE — 용어 삭제 */
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json(
        { success: false, error: "id가 필요합니다." } satisfies ApiResponse<never>,
        { status: 400 }
      );
    }

    const removed = removeGlossaryEntry(id);
    return NextResponse.json({
      success: true,
      data: removed,
    } satisfies ApiResponse<boolean>);
  } catch {
    return NextResponse.json(
      { success: false, error: "용어 삭제 실패" } satisfies ApiResponse<never>,
      { status: 500 }
    );
  }
}

/** PATCH — 용어 수정 */
export async function PATCH(request: NextRequest) {
  try {
    const { id, source, target, context } = await request.json();
    if (!id) {
      return NextResponse.json(
        { success: false, error: "id가 필요합니다." } satisfies ApiResponse<never>,
        { status: 400 }
      );
    }

    const updated = updateGlossaryEntry(id, { source, target, context });
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "항목을 찾을 수 없습니다." } satisfies ApiResponse<never>,
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
    } satisfies ApiResponse<GlossaryEntry>);
  } catch {
    return NextResponse.json(
      { success: false, error: "용어 수정 실패" } satisfies ApiResponse<never>,
      { status: 500 }
    );
  }
}
