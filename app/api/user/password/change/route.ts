// app/api/user/password/route.ts

import bcrypt from "bcryptjs";
import { requireAuth } from "@/lib/utils/auth";
import { NextRequest, NextResponse } from "next/server";
import { updateUserPassword, getHashPassword } from "@/src/service/user.service";

type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

// パスワード変更(一般ユーザー用：旧パスワードから新パスワード)
// 単純なリソース置き換えではなく、認証を伴う操作なのでPOSTが自然です。
export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const hashPassword = await getHashPassword(auth.user.sub);
  if (!hashPassword) {
    return NextResponse.json(
      { success: false, message: "Forbidden" },
      { status: 403 }
    );
  }

  const body = (await request.json()) as ChangePasswordRequest;
  const { currentPassword, newPassword } = body;

  // ✅ 引数の順番を修正
  const isValid = await bcrypt.compare(currentPassword, hashPassword);

  if (!isValid) {
    return NextResponse.json(
      { success: false, message: "現在のパスワードが正しくありません" },
      { status: 401 }
    );
  }

  // 新しいパスワードをハッシュ化して保存
  const newHashedPassword = await bcrypt.hash(newPassword, 10);
  const user = await updateUserPassword({ id: auth.user.sub, hashPassword: newHashedPassword });

  return NextResponse.json({ success: true, data: user });
}
