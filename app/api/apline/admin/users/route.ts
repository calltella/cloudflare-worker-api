// app/api/apline/admin/users/route.ts

import { requireAuth } from "@/lib/utils/auth";
import { getUserWithAccount, updateUserAuth, deleteUser } from "@/src/service/user.service";
import { NextRequest, NextResponse } from "next/server";
import type { updateUserAuthority, deleteUserAuthority } from "@/src/service/user.service";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
  console.log(`auth: ${JSON.stringify(auth)}`);
  // 
  const res = await getUserWithAccount();
  console.log(`res: ${JSON.stringify(res)}`);
  return NextResponse.json(res)
}


export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const user = (await request.json()) as deleteUserAuthority;

  try {
    await deleteUser(user);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`deleteUser error: ${error}`);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// ユーザデータ更新
export async function PUT(
  request: NextRequest
) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const userAuth = (await request.json()) as updateUserAuthority;

  //await putUserSettings(user)
  await updateUserAuth(userAuth);
  return NextResponse.json({ success: true });
}
