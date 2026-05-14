// app/api/apline/favorite/[id]/route.ts

import { toggleAplineFavorite } from "@/src/service/apline.service";
import { requireAuth } from "@/lib/utils/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  // 
  const res = await toggleAplineFavorite(auth.user.sub, Number(id));
  return NextResponse.json(res)
}