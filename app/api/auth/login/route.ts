// app/api/auth/login/route.ts

/**
 * User専用TokenAPI
 * 
 * データ取得用のTokenAPIと似た構成だが
 * 将来的にデータ取得用は簡素にする予定
 * 
 */
import bcrypt from "bcryptjs"
import { signAccessToken, signRefreshToken } from "@/lib/jwt";
import { findUserByEmail } from "@/src/service/user.service";
import { putSessionToken } from "@/src/service/settings.service";

type LoginRequest = {
  email: string
  password: string
}

export async function POST(req: Request) {
  const body = (await req.json()) as LoginRequest
  const { email, password } = body
  const user = await findUserByEmail(email)

  if (!user) {
    return new Response("Invalid credentials", { status: 401 });
  }

  const dummyHash = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8eFQ6h0eK1TKoEt1T9Fp1hJpG6tK9G"

  const passwordHash = user?.passwordHash ?? dummyHash
  const isValid = await bcrypt.compare(password, passwordHash)

  if (!isValid) {
    return new Response("Invalid credentials", { status: 401 });
  }

  // ✅ Access Token
  const accessToken = await signAccessToken({
    sub: user.id,
    role: user.role,
  })

  // ✅ Refresh Token
  const refreshToken = await signRefreshToken()
  const refreshExpires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // 有効期限７日

  console.log('User Access RawrefreshToken:', refreshToken);

  // トークンはハッシュ化して保存（セキュリティ対策）
  const hashedToken = await bcrypt.hash(refreshToken, 10);

  // ✅ KV保存
  await putSessionToken(
    {
      userId: user.id,
      hashedToken: hashedToken,
      expiresAt: refreshExpires
    }, refreshToken);

  return Response.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    accessToken,
    refreshToken,
  });
}