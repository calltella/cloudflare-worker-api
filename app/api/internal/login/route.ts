// app/api/internal/login/route.ts

import { requireAuth } from "@/lib/utils/auth";
import { NextRequest, NextResponse } from "next/server";
import { getLoginHistory } from "@/src/features/user/actions/getLoginHistory";
import type { LoginHistoryWithUser } from "@/src/features/user/actions/getLoginHistory";
import { getUserFromUserId } from "@/src/service/user.service";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const currentUser = await getUserFromUserId(auth.user.sub);
  const isAdmin = currentUser.role === "admin";
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, message: "Forbidden" },
      { status: 403 }
    );
  }

  const res: LoginHistoryWithUser[] = await getLoginHistory();
  if (!res) {
    return NextResponse.json({ success: false })
  }

  return NextResponse.json({ success: true, data: res })
}


