import { requireAuth } from "@/lib/utils/auth";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAuthClient, AUTH_RESPONSE_HEADERS } from "@/lib/supabase";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  if (typeof body?.currentPassword !== "string" || typeof body?.newPassword !== "string" || body.newPassword.length < 8) {
    return NextResponse.json({ success: false, message: "パスワードは8文字以上で指定してください" }, { status: 400, headers: AUTH_RESPONSE_HEADERS });
  }

  // Reauthenticate using the current password, without using an admin/service-role key.
  const supabase = createSupabaseAuthClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: auth.user.email, password: body.currentPassword });
  if (error || !data.user || data.user.id !== auth.user.supabaseId) {
    return NextResponse.json({ success: false, message: "現在のパスワードが正しくありません" }, { status: 401, headers: AUTH_RESPONSE_HEADERS });
  }
  try {
    const { error: updateError } = await supabase.auth.updateUser({ password: body.newPassword });
    if (updateError) {
      return NextResponse.json({ success: false, message: "パスワードを変更できませんでした。Supabaseのパスワードポリシーを確認してください" }, { status: 400, headers: AUTH_RESPONSE_HEADERS });
    }
    return NextResponse.json({ success: true }, { headers: AUTH_RESPONSE_HEADERS });
  } finally {
    // Dispose of the temporary password-confirmation session only.
    await supabase.auth.signOut({ scope: "local" });
  }
}
