"use server";

// src/service/notes.service.ts
import * as dz from "drizzle-orm";
import { getDB } from "@/lib/utils/db";
import { users, account, loginHistories, sessions, aplineUsers } from "@/db/schema/users";
import { type NewLoginHistory } from "@/db/schema/users";
import { auth } from "@/lib/auth.config";
import { getUserSettings, putUserSettings } from "@/src/service/settings.service";
import { getJstDateTimeString } from "@/lib/utils/date";
import { UserSettings } from "@/types/user";
import type { UserRole } from "@/types/user";

/**
 * 共通DB取得
 */
async function db() {
  return await getDB();
}

/**
 * セッションから管理者ＩＤの確認
 */
export async function getUserFromUserId(userId: string) {
  const database = await db();

  const result = await database
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      avatarURL: users.avatarUrl,
      isActive: users.isActive
    })
    .from(users)
    .where(dz.eq(users.id, userId))
    .limit(1);

  return result[0] ?? null;
}
/**
 * User取得( メールアドレスからユーザーを取得 )
 * 認証なしで通過する
 * email から ユーザーIDを取得
 */
export async function findUserByEmail(email: string) {
  const database = await db();

  const result = await database
    .select()
    .from(users)
    .where(dz.and(dz.eq(users.email, email), dz.eq(users.isActive, true)))
    .limit(1);

  return result[0] ?? null;
}

/**
 * 自分以外のUser取得を取得
 */
export async function getOtherUsers(userId: string) {
  const database = await db();

  return await database
    .select({ id: users.id })
    .from(users)
    .where(dz.and(dz.ne(users.id, userId), dz.eq(users.isActive, true)));
}

/**
 * 管理者用ユーザーリスト取得
 */
export async function getUserListsWithAccount() {
  const db = await getDB();

  const results = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      isActive: users.isActive,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      deletedAt: users.deletedAt,

      aplineUserId: aplineUsers.id,
      aplineUserName: aplineUsers.displayName,
    })
    .from(users)
    .where(dz.isNull(users.deletedAt))
    .leftJoin(account, dz.eq(users.id, account.userId))
    .leftJoin(aplineUsers, dz.eq(account.aplineUserId, aplineUsers.id))

  return results;
}

/**
 * User,Account取得
 */
export async function getUserWithAccount(userId: string) {
  const db = await getDB();

  const results = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      isActive: users.isActive,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,

      aplineUserId: aplineUsers.id,
      aplineUserName: aplineUsers.displayName,
    })
    .from(users)
    .where(dz.eq(users.id, userId))
    .leftJoin(account, dz.eq(users.id, account.userId))
    .leftJoin(aplineUsers, dz.eq(account.aplineUserId, aplineUsers.id))

  return results[0] ?? null;
}

/**
 * User一覧取得
 */
// export async function getUserLists() {
//   const database = await db();

//   const result = await database
//     .select({
//       id: users.id,
//       email: users.email,
//       name: users.name,
//       role: users.role,
//       isActive: users.isActive,
//       createdAt: users.createdAt,
//       updatedAt: users.updatedAt,
//     })
//     .from(users)
//     .where(dz.isNull(users.deletedAt))
//     .orderBy(users.createdAt)

//   return result ?? null;
// }

/**
 * ハッシュパスワード取得
 */
export async function getHashPassword(userId: string): Promise<string | null> {
  const database = await db();

  const result = await database
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(dz.eq(users.id, userId))
    .limit(1);

  return result[0]?.passwordHash ?? null;
}

/**
 * アカウント取得(auth.session)
 * getUserWithAccount で代用できる？
 */
export async function getAccount(userId: string) {
  const database = await db();

  const result = await database
    .select()
    .from(account)
    .where(dz.eq(account.userId, userId))
    .limit(1);

  return result[0] ?? null;
}

/**
 * アバター取得
 */
// export async function getUserAvatar(userId: string) {
//   const database = await db();

//   const result = await database
//     .select({ avatarUrl: users.avatarUrl })
//     .from(users)
//     .where(dz.eq(users.id, userId))
//     .limit(1);

//   return result[0] ?? null;
// }

/**
 * aplineユーザー一覧取得
 */
export async function getAplineUser() {
  const database = await db();

  const results = await database
    .select()
    .from(aplineUsers)
    .orderBy(aplineUsers.id);

  return results;
}

/**
 * aplineユーザー個別取得
 */
// export async function getAplineUserById(id: number) {
//   const database = await db();

//   const result = await database
//     .select()
//     .from(aplineUsers)
//     .where(dz.eq(aplineUsers.id, id))
//     .limit(1);

//   return result[0] ?? null;
// }

/**
 * アバター更新
 */
export async function updateUserAvatar(
  userId: string,
  avatarURL: string
) {
  const kv = await getUserSettings(userId);

  if (!kv) { throw new Error("User settings not found"); }

  const settings: UserSettings = {
    ...kv,
    avatarURL: avatarURL,
  };

  await putUserSettings(settings);

  return settings;
}

/**
 * カラーテーマ更新
 */
// export async function updateUserColorTheme(
//   userId: string,
//   theme: ColorThemeKey
// ) {
//   const kv = await getUserSettings(userId);

//   if (!kv) { throw new Error("User settings not found"); }

//   const settings: UserSettings = {
//     ...kv,
//     colorThemes: theme,
//     createdAt: getJstDateTimeString(),
//   };

//   await putUserSettings(userId, settings);
//   return settings;
// }

export type updateUserHashPassword = {
  id: string;
  hashPassword: string;
}

/**
 * パスワード更新
 */
export async function updateUserPassword(
  user: updateUserHashPassword
) {

  const database = await db();

  const result = await database
    .update(users)
    .set({ passwordHash: user.hashPassword })
    .where(dz.eq(users.id, user.id))
    .returning();
  if (result.length === 0) {
    throw new Error("削除対象が見つかりません");
  }
  return result;
}

/**
 * プロフィール更新
 */
export async function updateUserProfile(
  user: UserSettings
) {
  const database = await db();

  return await database
    .update(users)
    .set({ name: user.name, role: user.role, avatarUrl: user.avatarURL })
    .where(dz.eq(users.id, user.id))
    .returning();
}

export type updateUserAuthority = {
  id: string,
  name: string;
  role: UserRole,
  isActive: boolean,
}

/**
 * 権限関係更新
 */
export async function updateUserAuth(
  userAuth: updateUserAuthority
) {
  const database = await db();

  return await database
    .update(users)
    .set({
      name: userAuth.name,
      role: userAuth.role,
      isActive: userAuth.isActive,
      updatedAt: new Date().toISOString(),
    })
    .where(dz.eq(users.id, userAuth.id))
    .returning();
}

export type updateUserAplineConn = {
  id: string;
  aplineUserId: number;
}

/**
 * 権限関係更新
 */
export async function updateAplineUser(
  userConn: updateUserAplineConn
) {
  const database = await db();

  return await database
    .update(account)
    .set({
      aplineUserId: userConn.aplineUserId
    })
    .where(dz.eq(account.userId, userConn.id))
    .returning();
}

/**
 * テーマモード更新
 */
// export async function updateTheme(
//   userId: string,
//   themeMode: ThemeMode
// ) {
//   const kv = await getUserSettings(userId);

//   if (!kv) { throw new Error("User settings not found"); }

//   const settings: UserSettings = {
//     ...kv,
//     themeMode: themeMode,
//     createdAt: getJstDateTimeString(),
//   };

//   await putUserSettings(userId, settings);
//   return settings;
// }


export type NewUserCreateRequest = {
  name: string;
  email: string;
  role: UserRole;
}

/**
 * 新規ユーザー作成
 * @param user 
 * @returns 
 */
export async function createUser(
  user: NewUserCreateRequest,
): Promise<string> { // ✅ null を返さず throw する
  const database = await db();

  // ✅ メールアドレス重複チェック
  const existing = await database
    .select({ id: users.id })
    .from(users)
    .where(dz.eq(users.email, user.email))
    .limit(1);

  if (existing.length > 0) {
    throw new Error("DUPLICATE_EMAIL");
  }

  try {
    const newUser = await database
      .insert(users)
      .values({
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: true,
        createdAt: new Date().toISOString(),
      })
      .returning();

    const created = newUser[0];

    await database.insert(account).values({
      userId: created.id,
      type: "credentials",
    });

    return created.id;

  } catch (error) {
    // D1のUNIQUE制約エラーもカバー
    if (error instanceof Error && error.message.includes("UNIQUE")) {
      throw new Error("DUPLICATE_EMAIL");
    }
    console.error("createUser failed", error);
    throw new Error("ユーザー作成に失敗しました");
  }
}


/**
 * ユーザー削除
 */
type DeleteMode = "soft" | "hard";
export type deleteUserAuthority = {
  deleteUserId: string;
  deleteMode: DeleteMode;
}

export async function deleteUser(
  deleteAuth: deleteUserAuthority,
  adminUserId: string
) {
  const currentUser = await getUserFromUserId(adminUserId);

  const isAdmin = currentUser.role === "admin";

  if (!isAdmin) {
    throw new Error("削除権限がありません");
  }

  if (deleteAuth.deleteUserId === adminUserId) {
    throw new Error("自分自身は削除できません");
  }

  const database = await db();

  // ハードデリート
  if (deleteAuth.deleteMode === "hard") {
    const result = await database
      .delete(users)
      .where(dz.eq(users.id, deleteAuth.deleteUserId))
      .returning();

    if (result.length === 0) {
      throw new Error("削除対象が見つかりません");
    }

    return result;
  }

  // ソフトデリート
  const result = await database
    .update(users)
    .set({
      deletedAt: new Date().toISOString(),
      isActive: false,
    })
    .where(dz.eq(users.id, deleteAuth.deleteUserId))
    .returning();

  if (result.length === 0) {
    throw new Error("削除対象が見つかりません");
  }

  return result;
}



/**
 * ログイン履歴保存
 */
export async function saveLoginHistory(
  params: NewLoginHistory
) {
  const database = await db();

  await database.insert(loginHistories).values({
    userId: params.userId,
    ipAddress: params.ipAddress ?? "unknown",
    country: params.country ?? "unknown",
    userAgent: params.userAgent ?? null,
  });

  return true;
}

/**
 * セッション情報保存
 */
// export async function createSession(
//   userId: string,
//   refreshToken: string,
//   expiresAt: Date
// ) {
//   const database = await db();

//   await database
//     .insert(sessions).values({
//       id: crypto.randomUUID(),
//       userId,
//       refreshToken,
//       expiresAt,
//       createdAt: new Date(),
//     })
// }


/**
 * セッション情報取得
 */
// export async function getSession(refreshToken: string) {
//   //
//   const database = await db();

//   const [result] = await database
//     .select()
//     .from(sessions)
//     .where(dz.eq(sessions.refreshToken, refreshToken))
//     .limit(1);
//   return result;
// }
