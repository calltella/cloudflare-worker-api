// lib/auth.server.ts
import { headers } from "next/headers";
import { authenticateBearer, saveAuthLoginHistory } from "@/lib/utils/auth";
import type { User } from "@/db/schema/users";
import { initializeUserSettings } from "@/src/service/settings.service";

export async function getRequestMeta(user: User) {
  try {
    const headerList = await headers();
    await saveAuthLoginHistory({
      userId: user.id,
      ipAddress: headerList.get("cf-connecting-ip"),
      country: headerList.get("cf-ipcountry"),
      userAgent: headerList.get("user-agent"),
    });

    // ユーザー設定の初期化
    await initializeUserSettings(user.id);

  } catch (error) {
    // ログイン自体は失敗させない
    console.error("Failed to save login history:", error);
  }
}


// Compatibility for services that previously read a NextAuth cookie session.
// API services now use the verified bearer identity of the current request.
export async function auth() {
  const headerList = await headers();
  const result = await authenticateBearer(headerList.get("authorization"));
  if (!result.ok) return null;
  return { user: { id: result.user.sub, role: result.user.role, email: result.user.email, name: result.user.name } };
}
