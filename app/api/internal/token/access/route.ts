// api/token/route.ts
import bcrypt from "bcryptjs"
import { signAccessToken, signRefreshToken } from "@/lib/jwt";
import { findUserByEmail } from "@/src/service/user.service";
import { putSessionToken, initializeUserSettings } from "@/src/service/settings.service";

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
  const refreshExpires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // 有効期限７日

  console.log('RawrefreshToken:', refreshToken);

  // トークンはハッシュ化して保存（セキュリティ対策）
  const hashedToken = await bcrypt.hash(refreshToken, 10);

  // ✅ KV保存
  await putSessionToken(
    {
      userId: user.id,
      hashedToken: hashedToken,
      expiresAt: refreshExpires
    }, refreshToken);

  // KVにユーザーデータがなければ作成
  const setting = await initializeUserSettings(user.id);

  console.log(`refreshToken: ${JSON.stringify(refreshToken)}`);

  return Response.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatorURL: setting.avatarPath,
      themeMode: setting.themeMode,
      colorThemes: setting.colorThemes,
      defaultView: setting.defaultView,
    },
    accessToken,
    refreshToken,
  });
}