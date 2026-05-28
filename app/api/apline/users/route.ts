// app/api/apline/users/route.ts

import { getAplineUser, getUserWithAccount } from "@/src/service/user.service";
import { requireAuth } from "@/lib/utils/auth";
import { NextRequest, NextResponse } from "next/server";

// ログインIDからAplineUserIDを取得（GETに変える）
export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const res = await request.json();

  const data = await getUserWithAccount(res.userId);

  return NextResponse.json({ success: true, data: data });
}


// 管理者用（登録ユーザーリストを返す）
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
  //console.log(`auth: ${JSON.stringify(auth)}`);
  // 
  const res = await getAplineUser();
  //console.log(`res: ${JSON.stringify(res)}`);
  return NextResponse.json(res)
}