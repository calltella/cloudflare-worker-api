// app/api/token/refresh/route.ts

import bcrypt from "bcryptjs";
import { signAccessToken } from "@/lib/jwt";
import { getSessionToken } from "@/src/service/settings.service";

type RefreshRequest = {
  refreshToken: string
}

export async function POST(req: Request) {
  const body = (await req.json()) as RefreshRequest
  const { refreshToken } = body

  if (!refreshToken) {
    return new Response("Bad Request", { status: 400 })
  }

  // KVに書き換えてcompair
  const session = await getSessionToken(refreshToken)

  // セッションが見つからない
  if (!session) {
    return new Response("Unauthorized No session", { status: 401 })
  }

  const isValid = await bcrypt.compare(refreshToken, session.hashedToken);

  // セッションが不正
  if (!isValid) {
    return new Response("Unauthorized isValid", { status: 401 })
  }

  const now = new Date()

  // ✅ 更新期限チェック
  if (now > session.expiresAt) {
    return new Response("Expired", { status: 401 })
  }

  const newAccessToken = await signAccessToken({
    sub: session.userId,
  })

  return Response.json({
    accessToken: newAccessToken,
  })
}