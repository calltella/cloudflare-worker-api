import bcrypt from "bcryptjs";
import { signAccessToken } from "@/lib/jwt";
import { getSessionToken } from "@/src/service/settings.service";
import { NextRequest, NextResponse } from "next/server";

type RefreshRequest = {
  userId: string;
  refreshToken: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as RefreshRequest;
  const { userId, refreshToken } = body;

  if (!userId || !refreshToken) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  // KVからセッション取得
  const session = await getSessionToken(userId);
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

  // ✅ スコープを外に出す
  const newAccessToken = await signAccessToken({ sub: userId });
  console.log(`RefreshToken issue`);
  return NextResponse.json({
    accessToken: newAccessToken,
  });
}