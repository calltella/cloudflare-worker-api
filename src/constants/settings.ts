// /app/src/constants/settings.ts

import { UserSettings, LoginResponse, StoredTokens } from "@/types/user";
/**
 * KV用 ユーザー設定
*/
export const DEFAULT_USER_SETTINGS: UserSettings = {
  id: '',
  name: '',
  email: '',
  role: 'user',
  avatarURL: 'avatar/default.png',
  themeMode: 'light',
  colorThemes: 'default',
  defaultView: '',
};

export const STORED_DEFAULT_TOKEN: StoredTokens = {
  accessToken: '',
  refreshToken: '',
  accessTokenExpiry: 0,
  refreshTokenExpiry: 0
};

export const LOGINRESPONCE_DEFAULT: LoginResponse = {
  user: DEFAULT_USER_SETTINGS,
  tokens: STORED_DEFAULT_TOKEN,
};
