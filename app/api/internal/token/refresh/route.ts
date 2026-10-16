import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAuthClient, findApplicationUser, sessionTokens, AUTH_RESPONSE_HEADERS } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (typeof body?.refreshToken !== "string" || !body.refreshToken) {
    return NextResponse.json({ message: "Refresh token is required" }, { status: 400, headers: AUTH_RESPONSE_HEADERS });
  }

  // An expired access token must not prevent refresh. Supabase validates the refresh token.
  const supabase = createSupabaseAuthClient();
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: body.refreshToken });
  if (error || !data.session || !data.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: AUTH_RESPONSE_HEADERS });
  }
  if (!await findApplicationUser(data.user)) {
    await supabase.auth.signOut({ scope: "local" });
    return NextResponse.json({ message: "Forbidden" }, { status: 403, headers: AUTH_RESPONSE_HEADERS });
  }
  return NextResponse.json(sessionTokens(data.session), { headers: AUTH_RESPONSE_HEADERS });
}
