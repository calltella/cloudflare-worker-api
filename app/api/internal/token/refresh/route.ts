import bcrypt from "bcryptjs";
import { signAccessToken } from "@/lib/jwt";
import { getSessionToken } from "@/src/service/settings.service";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/utils/auth";
import { putSessionToken } from "@/src/service/settings.service";

type RefreshRequest = {
  refreshToken: string;
};

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as RefreshRequest;
  const { refreshToken } = body;

  if (!auth.user.sub || !refreshToken) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  console.log(`RefreshToken Get KV Session`);
  // KVからセッション取得
  const session = await getSessionToken(auth.user.sub);
  if (!session) {
    return new NextResponse("Unauthorized: No session", { status: 401 });
  }

  // リフレッシュトークンの有効期限チェック（bcrypt前に確認）
  if (session.refreshTokenExpiry <= Date.now()) {
    return new NextResponse("Unauthorized: Token expired", { status: 401 });
  }

  // ✅ 平文とハッシュを比較
  const isValid = await bcrypt.compare(refreshToken, session.refreshToken);
  if (!isValid) {
    return new NextResponse("Unauthorized: Invalid token", { status: 401 });
  }

  const now = Date.now();

  // ✅ スコープを外に出す
  const newAccessToken = await signAccessToken({ sub: auth.user.sub });

  // ✅ KVのアクセストークンを更新
  await putSessionToken(auth.user.sub, {
    ...session,
    accessToken: newAccessToken,
    accessTokenExpiry: now + 14 * 60 * 1000,
    refreshTokenExpiry: now + 7 * 24 * 60 * 60 * 1000,
  });

  console.log(`RefreshToken issue`);
  return NextResponse.json({
    accessToken: newAccessToken,
  });
}