// app/api/apline/admin/users/route.ts

import { requireAuth } from "@/lib/utils/auth";
import { getUserWithAccount, updateUserAuth, deleteUser } from "@/src/service/user.service";
import { NextRequest, NextResponse } from "next/server";
import type { updateUserAuthority, deleteUserAuthority } from "@/src/service/user.service";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
  //console.log(`auth: ${JSON.stringify(auth)}`);
  // 
  const res = await getUserWithAccount();
  //console.log(`res: ${JSON.stringify(res)}`);
  return NextResponse.json({ success: true, data: res });
}

/**
 * ユーザー削除
 * @param request 
 * @returns 
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const deleteUserId = (await request.json()) as deleteUserAuthority;

  try {
    await deleteUser(deleteUserId, auth.user.sub);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`deleteUser error: ${error}`);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// ユーザデータ更新
export async function PUT(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const userAuth = (await request.json()) as updateUserAuthority;

  await updateUserAuth(userAuth);
  return NextResponse.json({ success: true });
}
