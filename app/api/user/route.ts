// app/api/user/route.ts

import { getUserSettings, putUserSettings } from "@/src/service/settings.service";
import { requireAuth } from "@/lib/utils/auth";
import { NextRequest, NextResponse } from "next/server";
import type { UserSettings, StoredTokens } from "@/types/user";
import { updateUserProfile } from "@/src/service/user.service"
import { createUser, getUserFromUserId } from "@/src/service/user.service";
import type { NewUserCreateRequest } from "@/src/service/user.service";
import { USER_DEFAULT_SETTINGS } from "@/src/constants/settings";

// 新規ユーザー作成
export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const adminUser = await getUserFromUserId(auth.user.sub);
  if (adminUser.role !== "admin") {
    return NextResponse.json(
      { success: false, message: "Forbidden" },
      { status: 403 }
    );
  }

  const user = (await request.json()) as NewUserCreateRequest;

  const newUser: UserSettings = {
    ...USER_DEFAULT_SETTINGS,
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

  // 
  const res = await getUserSettings(auth.user.sub);
  return NextResponse.json(res)
}

// ユーザデータ更新
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const user = (await request.json()) as UserSettings;

  await putUserSettings(user)
  await updateUserProfile(user);
  return NextResponse.json({ success: true });
}