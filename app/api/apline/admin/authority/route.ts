// app/api/apline/admin/users/route.ts

import { requireAuth } from "@/lib/utils/auth";
import { NextRequest, NextResponse } from "next/server";
import type { updateUserAplineConn } from "@/src/service/user.service";
import { updateAplineUser } from "@/src/service/user.service";

// ユーザデータ更新
export async function PUT(
  request: NextRequest
) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
  if (auth.user.role !== "admin") return new NextResponse("Forbidden", { status: 403 });

  const userAuth = (await request.json()) as updateUserAplineConn;

  await updateAplineUser(userAuth);
  return NextResponse.json({ success: true });
}

// D1 password hashes are no longer authentication credentials.
// Reset passwords through Supabase Auth recovery/admin tooling.
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
  if (auth.user.role !== "admin") return new NextResponse("Forbidden", { status: 403 });
  return NextResponse.json(
    { success: false, message: "パスワード再設定はSupabase Authで実施してください。D1のハッシュ更新APIは廃止しました。" },
    { status: 410 },
  );
}
