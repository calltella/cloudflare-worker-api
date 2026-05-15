// app/api/apline/admin/users/route.ts

import { requireAuth } from "@/lib/utils/auth";
import { NextRequest, NextResponse } from "next/server";
import type { updateUserAplineConn } from "@/src/service/user.service";
import type { updateUserHashPassword } from "@/src/service/user.service";
import { updateAplineUser, updateUserPassword } from "@/src/service/user.service";

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

/**
 * パスワード再設定
 * @param request 
 * @returns 
 */
export async function POST(
  request: NextRequest
) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const userPassword = (await request.json()) as updateUserHashPassword;

  try {
    await updateUserPassword(userPassword);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`deleteUser error: ${error}`);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
