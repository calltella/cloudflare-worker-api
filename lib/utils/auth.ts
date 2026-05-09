import bcrypt from "bcryptjs";
import { findUserByEmail, getAccount, saveLoginHistory } from "@/src/service/user.service"
import type { User, NewLoginHistory } from "@/db/schema/users";

import { verifyAccessToken } from "@/lib/jwt";

export type AuthResult =
  | { ok: true; user: any }
  | { ok: false; response: Response };

export async function requireAuth(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    console.log(`authHeader`)
    return {
      ok: false,
      response: new Response("Unauthorized", { status: 401 }),
    };
  }

  const token = authHeader.split(" ")[1];
  console.log(`token: ${token}`)
  const payload = await verifyAccessToken(token);

  if (!payload) {
    console.log(`payload`)
    return {
      ok: false,
      response: new Response("Invalid token", { status: 401 }),
    };
  }

  return {
    ok: true,
    user: payload,
  };
}


/**
 * メールアドレスとハッシュ化前パスワードでユーザーを取得
 * @param email string
 * @param password string（平文）
 */
export async function getUserFromDb(
  email: string,
  password: string
): Promise<User | null> {
  const user = await findUserByEmail(email); // emailで検索

  if (!user) return null;

  if (!user.passwordHash) return null;

  // console.log(`/app/lib/utils/auth.ts : ${user.passwordHash}`)
  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) return null;

  return user;
}

/**
 * 
 * ログイン履歴保存
 */

export async function saveAuthLoginHistory({
  userId,
  ipAddress,
  country,
  userAgent,
}: NewLoginHistory) {
  try {
    await saveLoginHistory({
      userId,
      ipAddress,
      country,
      userAgent,
    });
  } catch (error) {
    console.error("Failed to insert login history:", error);
  }
}