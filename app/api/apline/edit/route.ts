// app/api/apline/edit/route.ts

import { getAplineArticleLock, fetchAplineSingle } from "@/src/service/apline.service";
import { requireAuth } from "@/lib/utils/auth";
import { NextRequest, NextResponse } from "next/server";
import type { AplineSingleDTO } from "@/src/features/apline/types/ui";
import { getJstDateTimeString } from "@/lib/utils/date";

type getAplineGetMode = "edit" | "copy";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const { searchParams } = request.nextUrl;

  const articleIdRaw = searchParams.get("id");
  if (!articleIdRaw) {
    return NextResponse.json({ success: false, reason: "error", message: "記事番号がありません" }, { status: 400 });
  }
  const articleId = Number(articleIdRaw);
  if (isNaN(articleId)) {
    return NextResponse.json({ success: false, reason: "error", message: "記事番号が不正です" }, { status: 400 });
  }

  const modeRaw = searchParams.get("mode");
  if (modeRaw !== "edit" && modeRaw !== "copy") {
    return NextResponse.json({ success: false, reason: "error", message: "取得モードが不正です" }, { status: 400 });
  }
  const mode: getAplineGetMode = modeRaw;

  // resをtryの外で宣言
  let res: AplineSingleDTO;
  try {
    res = await fetchAplineSingle(auth.user.sub, articleId);
  } catch (error) {
    return NextResponse.json({ success: false, reason: "error", message: "データがありません" }, { status: 403 });
  }

  // データの編集
  if (mode === "edit") {
    const lock = await getAplineArticleLock(auth.user.sub, articleId);
    if (!lock.acquired) {
      // ロック情報と記事情報を分けて返す
      return NextResponse.json({
        success: false,
        reason: "locked",
        data: {
          lock: lock.lock,
          article: res,
        },
      });
    }
    return NextResponse.json({ success: true, data: res });
  }

  // コピーして編集
  const now = getJstDateTimeString();
  return NextResponse.json({
    success: true,
    data: {
      ...res,
      id: "",
      apid: "",
      mailFlag: false,
      statusId: 2,
      occurrenceDate: now,
      reception: now,
      workStartTime: now,
      workEndTime: "",
      organization: "",
      responsible: "",
      customerImpact: "",
      correspondingNote: "",
      files: [],
    },
  });
}