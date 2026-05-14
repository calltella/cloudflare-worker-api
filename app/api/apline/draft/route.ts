// app/api/apline/draft/route.ts
import { getDraftAplineList } from "@/src/service/aplineSub.service";
import { requireAuth } from "@/lib/utils/auth";
import { NextRequest, NextResponse } from "next/server";

// 1件取得 GET    /notes/:id
// 更新 PUT    /notes/:id

// 一覧取得 GET /notes
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
  console.log(`auth: ${JSON.stringify(auth)}`);
  // 
  const res = await getDraftAplineList(auth.user.sub);
  console.log(`res: ${JSON.stringify(res)}`);
  return NextResponse.json(res)
}