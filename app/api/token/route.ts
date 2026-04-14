// api/token/route.ts
import bcrypt from "bcryptjs"
import { signAccessToken, signRefreshToken } from "@/lib/jwt";
import { findUserByEmail, createSession } from "@/src/service/user.service"

type LoginRequest = {
  email: string
  password: string
}

export async function POST(req: Request) {
  const body = (await req.json()) as LoginRequest
  const { email, password } = body

  const dummyHash =
    "$2a$10$CwTycUXWue0Thq9StjUM0uJ8eFQ6h0eK1TKoEt1T9Fp1hJpG6tK9G"

  const user = await findUserByEmail(email)
  const passwordHash = user?.passwordHash ?? dummyHash

  const isValid = await bcrypt.compare(password, passwordHash)

  if (!isValid || !user) {
    return new Response("Unauthorized", { status: 401 })
  }

  // ✅ Access Token
  const accessToken = await signAccessToken({
    sub: user.id,
    role: user.role,
  })

  // ✅ Refresh Token
  const refreshToken = await signRefreshToken()
  const refreshExpires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)

  // ✅ D1保存
  await createSession(user.id, refreshToken, refreshExpires)

  return Response.json({
    accessToken,
    refreshToken,
  })
}