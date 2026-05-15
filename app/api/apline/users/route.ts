// app/api/apline/users/route.ts

import { getAplineUser } from "@/src/service/user.service";
import { requireAuth } from "@/lib/utils/auth";
import { NextRequest, NextResponse } from "next/server";

// 
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
  //console.log(`auth: ${JSON.stringify(auth)}`);
  // 
  const res = await getAplineUser();
  //console.log(`res: ${JSON.stringify(res)}`);
  return NextResponse.json(res)
}