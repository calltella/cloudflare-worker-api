import { createClient, type Session, type User as SupabaseUser } from "@supabase/supabase-js";
import { findUserByEmail } from "@/src/service/user.service";
import type { StoredTokens } from "@/types/user";

// A fresh client per request prevents sessions leaking between Workers requests.
export function createSupabaseAuthClient(accessToken?: string) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are required");

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}

// Only a verified Supabase identity can be linked to an existing business user.
// The application role always comes from D1, never user_metadata or JWT role.
export async function findApplicationUser(identity: SupabaseUser) {
  if (!identity.email || !identity.email_confirmed_at || identity.is_anonymous) return null;
  const user = await findUserByEmail(identity.email);
  if (!user || !user.isActive || user.deletedAt) return null;
  return user;
}

export function sessionTokens(session: Session): StoredTokens {
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    accessTokenExpiry: (session.expires_at ?? Math.floor(Date.now() / 1000) + session.expires_in) * 1000,
    // Application idle timeout. Supabase also enforces its own session policy.
    refreshTokenExpiry: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
}

export const AUTH_RESPONSE_HEADERS = { "Cache-Control": "no-store", Pragma: "no-cache" };
