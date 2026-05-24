// app/api/apline/edit/lock/route.ts

import { requireAuth } from "@/lib/utils/auth";
import { NextRequest, NextResponse } from "next/server";
import { getAplineArticleLock } from "@/src/service/apline.service";
import type { ArticleLockResponce } from "@/src/service/apline.service";

// 記事を自分の為にロックします（既にロックされていたら acquired:false )
export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const { searchParams } = request.nextUrl;

  const articleIdRaw = searchParams.get("articleId");
  if (!articleIdRaw) {
    return NextResponse.json({ success: false, reason: "error", message: "記事番号がありません" }, { status: 400 });
  }
  const articleId = Number(articleIdRaw);

  const res: ArticleLockResponce = await getAplineArticleLock(auth.user.sub, articleId);

  return NextResponse.json({ success: true, data: res });
}