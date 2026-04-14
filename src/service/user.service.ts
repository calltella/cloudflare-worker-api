"use server";

// src/service/notes.service.ts
import * as dz from "drizzle-orm";
import { getDB } from "@/lib/utils/db";
import { users, account, loginHistories, sessions } from "@/db/schema/users";
import { type NewLoginHistory } from "@/db/schema/users";
import { auth } from "@/lib/auth.config";
import { getUserSettings, putUserSettings } from "@/src/service/settings.service";
import { getJstDateTimeString } from "@/lib/utils/date";
import { UserSettings } from "@/types/user";

/**
 * 共通DB取得
 */
async function db() {
  return await getDB();
}

/**
 * セッションから管理者ＩＤの確認
 */
export async function requireAdmin() {
  const session = await auth();

  if (!session) {
    throw new Error("Unauthorized");
  }

  if (session.user.role !== "admin") {
    throw new Error("Forbidden");
  }

  return session;
}
/**
 * User取得( メールアドレスからユーザーを取得 )
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
// export async function getOtherUsers() {
//   const session = await auth();
//   const database = await db();
//   if (!session) {
//     throw new Error("Unauthorized");
//   }

//   return await database
//     .select({ id: users.id })
//     .from(users)
//     .where(dz.and(dz.ne(users.id, session.user.id), dz.eq(users.isActive, true)));
// }

/**
 * User,Account取得
 */
// export async function getUserWithAccount(userId: string) {
//   const db = await getDB();

//   const results = await db
//     .select({
//       id: users.id,
//       email: users.email,
//       name: users.name,
//       role: users.role,
//       isActive: users.isActive,
//       avatarUrl: users.avatarUrl,
//       createdAt: users.createdAt,
//       updatedAt: users.updatedAt,

//       aplineUserId: aplineUsers.id,
//       aplineUserName: aplineUsers.displayName,
//     })
//     .from(users)
//     .where(dz.eq(users.id, userId))
//     .leftJoin(account, dz.eq(users.id, account.userId))
//     .leftJoin(aplineUsers, dz.eq(account.aplineUserId, aplineUsers.id))

//   return results[0] ?? null;
// }

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
// export async function getHashPassword(userId: string): Promise<string | null> {
//   const database = await db();

//   const result = await database
//     .select({ passwordHash: users.passwordHash })
//     .from(users)
//     .where(dz.eq(users.id, userId))
//     .limit(1);

//   return result[0]?.passwordHash ?? null;
// }

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
// export async function getAplineUser() {
//   const database = await db();

//   const results = await database
//     .select()
//     .from(aplineUsers)
//     .orderBy(aplineUsers.id);

//   return results;
// }

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
  avatarPath: string
) {
  const kv = await getUserSettings(userId);

  if (!kv) { throw new Error("User settings not found"); }

  const settings: UserSettings = {
    ...kv,
    avatarPath: avatarPath,
    createdAt: getJstDateTimeString(),
  };

  await putUserSettings(userId, settings);

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

/**
 * パスワード更新
 */
// export async function updateUserPassword(
//   userId: string,
//   password: string
// ) {
//   const hashed = await bcrypt.hash(password, 10);
//   const database = await db();

//   return await database
//     .update(users)
//     .set({ passwordHash: hashed })
//     .where(dz.eq(users.id, userId))
//     .returning();
// }

/**
 * プロフィール更新
 */
// export async function updateUserProfile(
//   userId: string,
//   name: string,
//   email: string
// ) {
//   const database = await db();

//   return await database
//     .update(users)
//     .set({ name, email })
//     .where(dz.eq(users.id, userId))
//     .returning();
// }

/**
 * 権限関係更新
 */
// export async function updateUserAuth(
//   userId: string,
//   role: "user" | "admin",
//   isActive: boolean
// ) {
//   const database = await db();

//   return await database
//     .update(users)
//     .set({
//       role,
//       isActive,
//       updatedAt: new Date().toISOString(),
//     })
//     .where(dz.eq(users.id, userId))
//     .returning();
// }

/**
 * 権限関係更新
 */
// export async function updateAplineUser(
//   userId: string,
//   aplineUserId: number,
// ) {
//   const database = await db();

//   return await database
//     .update(account)
//     .set({
//       aplineUserId: aplineUserId
//     })
//     .where(dz.eq(account.userId, userId))
//     .returning();
// }

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

/**
 * 新規ユーザー作成
 */
// export async function createUser(
//   name: string,
//   email: string,
//   role: "user" | "admin",
// ) {
//   await requireAdmin();

//   const database = await db();
//   const newUser = await database
//     .insert(users)
//     .values({
//       name: name,
//       email: email,
//       role: role,
//       isActive: true,
//       createdAt: new Date().toISOString(),
//     })
//     .returning();

//   const created = newUser[0];

//   await database.insert(account).values({
//     userId: created.id,
//     type: "credentials",
//   });

//   return created;
// }

/**
 * ユーザー削除
 */
// export async function deleteUser(
//   userId: string
// ) {
//   const currentUser = await requireAdmin();
//   if (currentUser.user.id === userId) {
//     throw new Error("自分自身は削除できません");
//   }
//   const database = await db();
//   const result = await database
//     .update(users)
//     .set({
//       deletedAt: new Date().toISOString(),
//       isActive: false,
//     })
//     .where(dz.eq(users.id, userId))
//     .returning();

//   return result;
// }



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
