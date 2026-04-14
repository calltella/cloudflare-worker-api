// app/api/token/refresh/route.ts

import { signAccessToken } from "@/lib/jwt";
import { getSession } from "@/src/service/user.service";

type RefreshRequest = {
  refreshToken: string
}

export async function POST(req: Request) {
  const body = (await req.json()) as RefreshRequest
  const { refreshToken } = body

  if (!refreshToken) {
    return new Response("Bad Request", { status: 400 })
  }

  const session = await getSession(refreshToken)

  if (!session) {
    return new Response("Unauthorized", { status: 401 })
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