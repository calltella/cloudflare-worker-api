

import { requireAuth } from "@/lib/utils/auth";
import { getUserListsWithAccount, updateUserAuth, deleteUser } from "@/src/service/user.service";
import { deleteAplineById } from "@/src/service/apline.service";


import { NextRequest, NextResponse } from "next/server";
import type { updateUserAuthority, deleteUserAuthority } from "@/src/service/user.service";

type DeleteArticleId = { id: string; } // userID
// apline投稿記事の削除
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const deleteId: DeleteArticleId = await request.json();

  const res = await deleteAplineById(auth.user.sub, Number(deleteId.id));

  if (!res) {
    return NextResponse.json({ success: false }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: res });

}
