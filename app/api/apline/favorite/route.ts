// app/api/apline/favorite/route.ts
import { getFavoriteAplineList } from "@/src/service/aplineSub.service";
import { toggleAplineFavorite } from "@/src/service/apline.service";
import { requireAuth } from "@/lib/utils/auth";
import { NextRequest, NextResponse } from "next/server";

// idなし → 一覧
// idあり → トグル
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const { searchParams } = request.nextUrl;

  const favoriteId = searchParams.get("id");

  if (!favoriteId) {

    const res = await getFavoriteAplineList(auth.user.sub);
    if (res.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    return NextResponse.json({ success: true, data: res })
  }
  const res = await toggleAplineFavorite(auth.user.sub, Number(favoriteId));

  return NextResponse.json({ success: true, data: res })

}