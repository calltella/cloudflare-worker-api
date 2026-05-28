// app/api/user/route.ts

import { getUserSettings, putUserSettings } from "@/src/service/settings.service";
import { requireAuth } from "@/lib/utils/auth";
import { NextRequest, NextResponse } from "next/server";
import type { UserSettings, StoredTokens } from "@/types/user";
import { updateUserProfile } from "@/src/service/user.service"
import { createUser, getUserFromUserId } from "@/src/service/user.service";
import type { NewUserCreateRequest } from "@/src/service/user.service";
import { DEFAULT_USER_SETTINGS } from "@/src/constants/settings";

// 新規ユーザー作成
export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const adminUser = await getUserFromUserId(auth.user.sub);
  const isAdmin = adminUser.role === "admin";
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, message: "Forbidden" },
      { status: 403 }
    );
  }

  const user: NewUserCreateRequest = await request.json();

  const newUser: UserSettings = {
    ...DEFAULT_USER_SETTINGS,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  try {
    const userId = await createUser(newUser);
    return NextResponse.json(
      { success: true, data: userId }
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "DUPLICATE_EMAIL") {
      return NextResponse.json(
        { success: false, message: "このメールアドレスは既に登録されています。" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, message: "ユーザー作成に失敗しました。" },
      { status: 500 }
    );
  }
}


export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(request);
  console.log(`result: ${JSON.stringify(auth)}`);
  if (!auth.ok) return auth.response;

  const res = await getUserSettings(auth.user.sub);
  return NextResponse.json(res)
}

// ユーザデータ更新
// 20260523 email は更新NG、roleは管理者だけ更新
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const body: UserSettings = await request.json();

  // DBから現在のユーザーデータを取得（ベースにする）
  const currentUser = await getUserFromUserId(body.id);
  if (!currentUser) {
    return NextResponse.json({ success: false, message: "ユーザーが存在しません" }, { status: 404 });
  }

  const isAdmin = currentUser.role === "admin";

  const updateData: UserSettings = {
    ...currentUser,       // DBのデータをベース
    ...body,              // POSTされたデータで上書き
    email: currentUser.email,                          // emailは上書き不可
    role: isAdmin ? body.role : currentUser.role,      // roleは管理者のみ更新可
  };

  await putUserSettings(updateData);
  await updateUserProfile(updateData);

  return NextResponse.json({ success: true });
}
/**
 * currentUser = { id, name, email: "元のemail", role: "元のrole", avatarURL, ... }
{ ...currentUser, ...body }  // bodyで上書き
↓
email: currentUser.email     // emailを元に戻す
role: isAdmin ? body.role : currentUser.role  // roleを制御
 */