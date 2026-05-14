// app/api/apline/admin/reset-password/route.ts

import { requireAuth } from "@/lib/utils/auth";
import { NextRequest, NextResponse } from "next/server";
import type { updateUserHashPassword } from "@/src/service/user.service";
import { updateAplineUser, updateUserPassword } from "@/src/service/user.service";



// ユーザデータ更新
export async function PUT(
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