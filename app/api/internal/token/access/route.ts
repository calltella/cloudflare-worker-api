// api/token/route.ts

import bcrypt from "bcryptjs"
import { signAccessToken, signRefreshToken } from "@/lib/jwt";
import { findUserByEmail } from "@/src/service/user.service";
import { initializeUserSettings, putSessionToken, deleteSessionToken } from "@/src/service/settings.service";
import { NextRequest, NextResponse } from "next/server";
import { StoredTokens } from "@/types/user";
import { requireAuth } from "@/lib/utils/auth";

type LoginRequest = {
  email: string
  password: string
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as LoginRequest
  const { email, password } = body

  const now = Date.now();

  const dummyHash = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8eFQ6h0eK1TKoEt1T9Fp1hJpG6tK9G"

  const user = await findUserByEmail(email)
  const passwordHash = user?.passwordHash ?? dummyHash

  const isValid = await bcrypt.compare(password, passwordHash)

  if (!isValid || !user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  // ✅ Access Token
  const accessToken = await signAccessToken({
    sub: user.id,
    role: user.role,
  })

  // ✅ Refresh Token
  const refreshToken = await signRefreshToken()

  console.log('AccessToken issue');

  // トークンはハッシュ化して保存（セキュリティ対策）
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

  // ✅ KV保存
  const setting = await initializeUserSettings(user.id);

  const newStored: StoredTokens = {
    accessToken: accessToken,
    refreshToken: hashedRefreshToken,
    accessTokenExpiry: now + 14 * 60 * 1000,
    refreshTokenExpiry: now + 7 * 24 * 60 * 60 * 1000, // 使うたびに延長
  };

  await putSessionToken(user.id, newStored)

  console.log(`newStored: ${JSON.stringify(newStored)}`);
  console.log(`setting: ${JSON.stringify(setting)}`);

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarURL: setting.avatarURL,
      themeMode: setting.themeMode,
      colorThemes: setting.colorThemes,
      defaultView: setting.defaultView,
    },
    tokens: {
      ...newStored,
      refreshToken: refreshToken,
    }
  });
}

// KV保存セッション情報を削除
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
  console.log(`deleteUserSettings: ${auth.user.sub}`)
  await deleteSessionToken(auth.user.sub);

  return NextResponse.json({ success: true });
}