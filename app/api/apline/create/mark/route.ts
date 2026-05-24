// app/api/apline/create/mark/route.ts

import { markArticleAsRead } from "@/src/service/apline.service";
import { requireAuth } from "@/lib/utils/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const { searchParams } = request.nextUrl;

  const markId = searchParams.get("id");

  if (!markId) {

    const res = await markArticleAsRead(auth.user.sub, Number(markId));
    if (!res) {
      return NextResponse.json({ success: false })
    }

    return NextResponse.json({ success: true, data: res })
  }

}