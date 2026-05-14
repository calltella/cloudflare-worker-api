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

  const userAuth = (await request.json()) as updateUserAplineConn;

  await updateAplineUser(userAuth);
  return NextResponse.json({ success: true });
}
