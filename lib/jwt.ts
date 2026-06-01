// lib/jwt.ts
import { SignJWT, jwtVerify, JWTPayload } from "jose";
import { randomBytes } from "crypto";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)

// リフレッシュトークン用アクセストークンからユーザー取得
export async function decodeAccessTokenIgnoreExpiry(
  token: string
): Promise<{ sub: string } | null> {
  try {
    // verifyではなくdecodeで期限チェックをスキップ
    const payload = await jwtVerify(token, SECRET, {
      clockTolerance: Infinity, // 期限切れを無視
    });
    return { sub: payload.payload.sub as string };
  } catch {
    return null;
  }
}

// アクセストークンを発行
export async function signAccessToken(payload: JWTPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m") // 短命
    .sign(SECRET)
}

export async function signRefreshToken() {
  return randomBytes(32).toString("base64url");
}

// アクセストークンを検証
export async function verifyAccessToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload
  } catch {
    return null
  }
}