// app/api/user/password/reset/route.ts

import bcrypt from "bcryptjs";
import { requireAuth } from "@/lib/utils/auth";
import { NextRequest, NextResponse } from "next/server";
import { updateUserPassword } from "@/src/service/user.service";
import { getUserFromUserId } from "@/src/service/user.service";
import { deleteSessionToken } from "@/src/service/settings.service";

type ResetPasswordRequest = {
  userId: string;
  resetPassword: string;
};

// パスワードを強制変更（管理者用）
export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const adminUser = await getUserFromUserId(auth.user.sub);
  if (adminUser.role !== "admin") {
    return NextResponse.json(
      { success: false, message: "Forbidden" },
      { status: 403 }
    );
  }
  const body = (await request.json()) as ResetPasswordRequest;

  const user = await getUserFromUserId(body.userId);

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Forbidden" },
      { status: 403 }
    );
  }

  // セッションの削除
  await deleteSessionToken(body.userId);

  // 新しいパスワードをハッシュ化して保存
  const newHashedPassword = await bcrypt.hash(body.resetPassword, 10);
  try {
    const user = await updateUserPassword({ id: body.userId, hashPassword: newHashedPassword });
    return NextResponse.json({ success: true, data: user });
  } catch (error: unknown) {
    return NextResponse.json({ success: false });
  }
}

