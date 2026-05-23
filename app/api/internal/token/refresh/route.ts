import bcrypt from "bcryptjs";
import { signAccessToken, decodeAccessTokenIgnoreExpiry } from "@/lib/jwt";
import { getSessionToken } from "@/src/service/settings.service";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/utils/auth";
import { putSessionToken } from "@/src/service/settings.service";

type RefreshRequest = {
  refreshToken: string;
};

export async function POST(request: NextRequest) {
  // ① Authorizationヘッダーからアクセストークンを取得（期限切れOK）
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new NextResponse("Bad Request", { status: 400 });
  }
  const accessToken = authHeader.slice(7);
  console.log(`古い accessToken : ${accessToken}`)
  const decoded = await decodeAccessTokenIgnoreExpiry(accessToken);
  if (!decoded?.sub) {
    return new NextResponse("Unauthorized: Invalid token", { status: 401 });
  }
  const userId = decoded.sub;

  // ② リフレッシュトークンの検証
  const { refreshToken } = (await request.json()) as RefreshRequest;
  if (!refreshToken) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  const session = await getSessionToken(userId);
  if (!session) {
    return new NextResponse("Unauthorized: No session", { status: 401 });
  }

  if (session.refreshTokenExpiry <= Date.now()) {
    return new NextResponse("Unauthorized: Token expired", { status: 401 });
  }

  const isValid = await bcrypt.compare(refreshToken, session.refreshToken);
  if (!isValid) {
    return new NextResponse("Unauthorized: Invalid token", { status: 401 });
  }

  // ③ 新しいアクセストークン発行
  const now = Date.now();
  const newAccessToken = await signAccessToken({ sub: userId });

  await putSessionToken(userId, {
    ...session,
    accessToken: newAccessToken,
    accessTokenExpiry: now + 14 * 60 * 1000,
    refreshTokenExpiry: now + 7 * 24 * 60 * 60 * 1000,
  });

  return NextResponse.json({ accessToken: newAccessToken });
}