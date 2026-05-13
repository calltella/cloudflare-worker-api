// /types/user.ts

import type { ColorThemeKey } from "@/app/theme/colorTheme";

export type UserRole = "admin" | "user";
export type ThemeMode = "light" | "dark" | "system";

// ユーザー設定の共通型（KV保存・LoginResponse共通で使用）
export type UserSettings = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarURL: string;
  themeMode: ThemeMode;
  colorThemes: ColorThemeKey;
  defaultView: string;
};

export type StoredTokens = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: number;
  refreshTokenExpiry: number;
};

export type LoginResponse = {
  user: UserSettings;
  tokens: StoredTokens;
};