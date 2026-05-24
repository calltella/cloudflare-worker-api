// app/api/apline/lists/route.ts

import { requireAuth } from "@/lib/utils/auth";
import { fetchAplineList } from "@/src/service/apline.service";
import { NextRequest, NextResponse } from "next/server";
import type { AplineListDTO } from "@/src/features/apline/types/ui";

export type fetchAplineListResponce = {
  currentPage: number,
  aplineDatas: AplineListDTO[],
  totalPages: number,
}

type GetAplineListQuery = {
  userId: string;
  currentPage: number;
  pageSize: number;
  shopId?: number;
  keyword?: string;
  unread?: boolean;
  incomplete?: boolean;
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  // token取得ユーザーと認証ユーザーは異なる
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const userId = await auth.user.sub;

  console.log(`認証ユーザー: ${auth.user.sub}`);

  // クエリパラメータを取得
  const { searchParams } = request.nextUrl;

  const currentPageRaw = searchParams.get("currentPage");
  const pageSizeRaw = searchParams.get("pageSize");

  // 必須パラメータのバリデーション
  if (!currentPageRaw || !pageSizeRaw) {
    return NextResponse.json(
      { success: false, message: "currentPage と pageSize は必須です" },
      { status: 400 }
    );
  }

  const currentPage = parseInt(currentPageRaw);
  const pageSize = parseInt(pageSizeRaw);

  if (isNaN(currentPage) || currentPage < 1) {
    return NextResponse.json(
      { success: false, message: "currentPage が不正です" },
      { status: 400 }
    );
  }
  if (isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
    return NextResponse.json(
      { success: false, message: "pageSize が不正です" },
      { status: 400 }
    );
  }

  // オプションパラメータ
  const shopIdRaw = searchParams.get("shopId");
  const keyword = searchParams.get("keyword") ?? undefined;
  const unreadRaw = searchParams.get("unread");
  const incompleteRaw = searchParams.get("incomplete");

  const shopId = shopIdRaw !== null ? parseInt(shopIdRaw) : undefined;
  const unread = unreadRaw !== null ? unreadRaw === "true" : undefined;
  const incomplete = incompleteRaw !== null ? incompleteRaw === "true" : undefined;

  const params: GetAplineListQuery = {
    userId,
    currentPage,
    pageSize,
    shopId,
    keyword,
    unread,
    incomplete,
  };

  const res: fetchAplineListResponce = await fetchAplineList(params);

  return NextResponse.json({ success: true, data: res });

}

