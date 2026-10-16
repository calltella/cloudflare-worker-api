import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAuthClient, findApplicationUser, sessionTokens, AUTH_RESPONSE_HEADERS } from "@/lib/supabase";
import { initializeUserSettings } from "@/src/service/settings.service";
import { getRequestMeta } from "@/lib/auth.server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (typeof body?.email !== "string" || typeof body?.password !== "string" || !body.email || !body.password) {
    return NextResponse.json({ message: "Email and password are required" }, { status: 400, headers: AUTH_RESPONSE_HEADERS });
  }

  const supabase = createSupabaseAuthClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: body.email, password: body.password });
  if (error || !data.session || !data.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: AUTH_RESPONSE_HEADERS });
  }

  const user = await findApplicationUser(data.user);
  if (!user) {
    await supabase.auth.signOut({ scope: "local" });
    return NextResponse.json({ message: "Forbidden" }, { status: 403, headers: AUTH_RESPONSE_HEADERS });
  }

  const setting = await initializeUserSettings(user.id);
  await getRequestMeta(user);
  return NextResponse.json({
    user: {
      ...setting,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    tokens: sessionTokens(data.session),
  }, { headers: AUTH_RESPONSE_HEADERS });
}

export async function DELETE(request: NextRequest) {
  const token = request.headers.get("authorization")?.match(/^Bearer ([^\s]+)$/i)?.[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: AUTH_RESPONSE_HEADERS });
  const supabase = createSupabaseAuthClient();
  const { data, error: authError } = await supabase.auth.getUser(token);
  if (authError || !data.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: AUTH_RESPONSE_HEADERS });
  // Uses the user's JWT, not a service-role key. Revokes this session's refresh tokens.
  const { error } = await supabase.auth.admin.signOut(token, "local");
  if (error) return NextResponse.json({ message: "Sign out failed" }, { status: 502, headers: AUTH_RESPONSE_HEADERS });
  return NextResponse.json({ success: true }, { headers: AUTH_RESPONSE_HEADERS });
}
