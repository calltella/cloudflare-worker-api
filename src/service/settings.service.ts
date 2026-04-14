// src/service/settings.service.ts

import { headers } from "next/headers";
import { getKV } from "@/lib/utils/kv";
import { DEFAULT_SETTINGS } from "@/types/user";
import { UserSettings, SessionSettings } from "@/types/user";
import { getJstDateTimeString } from "@/lib/utils/date";
import bcrypt from "bcryptjs";

// セッションを取得
export async function getSessionToken(hashedToken: string): Promise<SessionSettings | null> {
  const kv = await getKV();
  const sessionKey = `session:${hashedToken}`;

  try {
    const value = await kv.get(sessionKey);
    if (!value) {
      console.log(`getSessionToken: key not found: ${sessionKey}`);
      return null;
    }
    return JSON.parse(value) as SessionSettings;
  } catch (err) {
    if (err instanceof Error) {
      console.log(`getSessionTokenError: ${err.message} / ${err.stack}`);
    } else {
      console.log(`getSessionTokenError: ${String(err)}`);
    }
    return null;
  }
}

// セッションを保存
export async function putSessionToken(settings: SessionSettings): Promise<boolean> {
  const kv = await getKV();
  const sessionKey = `session:${settings.hashedToken}`;
  console.log('expiration:', Math.floor(settings.expiresAt.getTime() / 1000));
  console.log('now:', Math.floor(Date.now() / 1000));
  try {
    await kv.put(sessionKey, JSON.stringify(settings),
      {
        expiration: Math.floor(settings.expiresAt.getTime() / 1000),
      });
    return true;
  } catch (err) {
    if (err instanceof Error) {
      console.log(`putSessionTokenError: ${err.message} / ${err.stack}`);
    } else {
      console.log(`putSessionTokenError: ${String(err)}`);
    }
    return false;
  }
}


export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const kv = await getKV();
  const key = `user:${userId}:settings`;

  const data = await kv.get(key);

  if (!data) return null;

  try {
    return JSON.parse(data) as UserSettings;
  } catch (error) {
    console.error(`Failed to parse user settings for ${userId}:`, error);
    return null;
  }
}

export async function putUserSettings(
  userId: string,
  settings: UserSettings
): Promise<boolean> {
  const kv = await getKV();
  const key = `user:${userId}:settings`;
  console.log(`putUserSettings called with userId: ${userId}, settings: ${JSON.stringify(settings)}`);

  try {
    await kv.put(key, JSON.stringify(settings));
    return true;
  } catch (err) {
    return false;
  }
}

export async function deleteUserSettings(userId: string): Promise<boolean> {
  const kv = await getKV();
  const key = `user:${userId}:settings`;

  try {
    await kv.delete(key);
    return true;
  } catch (err) {
    return false;
  }
}

// KVからユーザーデータを取得(なければデフォルト)
export async function initializeUserSettings(userId: string): Promise<UserSettings> {
  const existing = await getUserSettings(userId);
  if (existing) return existing;

  const settings: UserSettings = {
    ...DEFAULT_SETTINGS,
    createdAt: getJstDateTimeString(),
  };

  await putUserSettings(userId, settings);

  return settings;
}

export interface ResetPasswordSettings {
  email: string;
  resetToken: string;
  expires: string;
  createdAt: string;
}

// パスワードリセット用のトークンをKVに保存
export async function putPasswordResetToken(email: string, token: string, expires: string): Promise<boolean> {
  const headerList = await headers();
  const ipAddress = headerList.get("cf-connecting-ip");

  const kv = await getKV();
  const key = `reset:${email}:${ipAddress}`;

  // トークンはハッシュ化して保存（セキュリティ対策）
  const hashedToken = await bcrypt.hash(token, 10);

  const settings: ResetPasswordSettings = {
    email: email,
    resetToken: hashedToken,
    expires: expires,
    createdAt: getJstDateTimeString(),
  };

  try {
    await kv.put(key, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error(`Failed to parse user settings for ${email}:`, error);
    return false;
  }
}

// パスワードリセット用のトークンをKVから取得
export async function getPasswordResetToken(email: string): Promise<ResetPasswordSettings | null> {
  const headerList = await headers();
  const ipAddress = headerList.get("cf-connecting-ip");

  const kv = await getKV();
  const key = `reset:${email}:${ipAddress}`;

  const data = await kv.get(key);

  if (!data) return null;

  try {
    return JSON.parse(data) as ResetPasswordSettings;
  } catch (error) {
    console.error(`Failed to parse user settings for ${email}:`, error);
    return null;
  }
}

// パスワードリセット用のトークンをKVから削除
export async function deletePasswordResetToken(email: string): Promise<boolean> {
  const headerList = await headers();
  const ipAddress = headerList.get("cf-connecting-ip");

  const kv = await getKV();
  const key = `reset:${email}:${ipAddress}`;

  try {
    await kv.delete(key);
    return true;
  } catch (err) {
    return false;
  }
}