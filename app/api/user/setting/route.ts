

import { getUserSettings, putUserSettings } from "@/src/service/settings.service";
import { requireAuth } from "@/lib/utils/auth";
import { NextRequest, NextResponse } from "next/server";
import type { UserSettings, StoredTokens } from "@/types/user";
import { updateUserProfile } from "@/src/service/user.service"

export async function GET(
  request: NextRequest
) {
  const auth = await requireAuth(request);
  console.log(`result: ${JSON.stringify(auth)}`);
  if (!auth.ok) return auth.response;

  // 
  const res = await getUserSettings(auth.user.sub);
  return NextResponse.json(res)
}

// ユーザデータ更新
export async function PUT(
  request: NextRequest
) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const user = (await request.json()) as UserSettings;

  //await putUserSettings(user)
  await updateUserProfile(user.id, user.name);
  return NextResponse.json({ success: true });
}