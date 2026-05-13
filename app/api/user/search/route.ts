// app/api/user/search/route.ts

import { requireAuth } from "@/lib/utils/auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * email にユーザーがぞんざいするか
 * @param req 
 * @returns 
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  console.log(`req: ${JSON.stringify(request)}`)

  return NextResponse.json(auth)
}