// app/api/apline/nav/[id]/route.ts
import { getBadgeCounts } from "@/src/service/apline.service";
import { requireAuth } from "@/lib/utils/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
  console.log(`auth response: ${JSON.stringify(auth)}`);
  // auth response: {"ok":true,
  // "user":{"sub":"326754cb","role":"admin","iat":1778286305,"exp":1778287205}}

  // ユーザー毎の未読・未完了取得
  const res = await getBadgeCounts(auth.user.sub);
  return NextResponse.json(res)
}
