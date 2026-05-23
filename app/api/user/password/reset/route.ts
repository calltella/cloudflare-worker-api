import bcrypt from "bcryptjs";
import { requireAuth } from "@/lib/utils/auth";
import { NextRequest, NextResponse } from "next/server";
import { updateUserPassword, getHashPassword } from "@/src/service/user.service";
import { createUser, requireAdmin } from "@/src/service/user.service";
import { deleteSessionToken } from "@/src/service/settings.service";

type ResetPasswordRequest = {
  resetPassword: string;
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const adminUser = await requireAdmin(auth.user.sub);
  if (adminUser.role !== "admin") {
    return NextResponse.json(
      { success: false, message: "Forbidden" },
      { status: 403 }
    );
  }

  // セッションの削除
  await deleteSessionToken(auth.user.sub);

  const body = (await request.json()) as ResetPasswordRequest;

  // 新しいパスワードをハッシュ化して保存
  const newHashedPassword = await bcrypt.hash(body.resetPassword, 10);
  try {
    const user = await updateUserPassword({ id: auth.user.sub, hashPassword: newHashedPassword });
    return NextResponse.json({ success: true, data: user });
  } catch (error: unknown) {
    return NextResponse.json({ success: false });
  }

  // ユーザーが存在するか確認(管理者かどうか？)
  // パスワードをハッシュにして書き換え
  // セッションを削除


}

