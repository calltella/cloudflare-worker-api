// app/api/apline/edit/lock/route.ts

import { requireAuth } from "@/lib/utils/auth";
import { NextRequest, NextResponse } from "next/server";
import { getAplineArticleLock, forceUnlockAplineLockAction } from "@/src/service/apline.service";
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

type DeleteArticleLockFlag = {
  articleId: string;
}

// ロックフラグを強制的に解除します
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const deleteLockFlag: DeleteArticleLockFlag = await request.json();

  try {
    const lock = await forceUnlockAplineLockAction(auth.user.sub, Number(deleteLockFlag.articleId));
    return NextResponse.json({ success: true, data: lock });
  } catch (error) {
    console.error(`deleteUser error: ${error}`);
    return NextResponse.json({ success: false }, { status: 500 });
  }

}