import { saveLoginHistory } from "@/src/service/user.service";
import type { NewLoginHistory } from "@/db/schema/users";
import type { UserRole } from "@/types/user";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAuthClient, findApplicationUser } from "@/lib/supabase";

export type AuthenticatedUser = {
  sub: string; // Existing D1 ID, retained for all business data.
  role: UserRole;
  email: string;
  name: string;
  supabaseId: string;
};

export type AuthResult =
  | { ok: true; user: AuthenticatedUser }
  | { ok: false; response: NextResponse };

export async function authenticateBearer(authHeader: string | null): Promise<AuthResult> {
  const token = authHeader?.match(/^Bearer ([^\s]+)$/i)?.[1];
  if (!token) return { ok: false, response: new NextResponse("Unauthorized", { status: 401 }) };

  const supabase = createSupabaseAuthClient();
  // Performs server-side verification with the configured Supabase Auth server.
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return { ok: false, response: new NextResponse("Invalid token", { status: 401 }) };
  }
  const user = await findApplicationUser(data.user);
  if (!user) return { ok: false, response: new NextResponse("Forbidden", { status: 403 }) };

  return {
    ok: true,
    user: { sub: user.id, role: user.role, email: user.email, name: user.name, supabaseId: data.user.id },
  };
}

export async function requireAuth(req: NextRequest): Promise<AuthResult> {
  return authenticateBearer(req.headers.get("authorization"));
}

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