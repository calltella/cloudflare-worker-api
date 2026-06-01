// app/api/internal/token/revoke/route.ts

import { decodeAccessTokenIgnoreExpiry } from "@/lib/jwt";
import { NextRequest, NextResponse } from "next/server";
import { deleteSessionToken } from "@/src/service/settings.service";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new NextResponse("Bad Request", { status: 400 });
  }
  const accessToken = authHeader.slice(7);
  console.log(`古い accessToken : ${accessToken}`);
  const decoded = await decodeAccessTokenIgnoreExpiry(accessToken);
  console.log(`decoded : ${JSON.stringify(decoded)}`);
  if (!decoded?.sub) {
    return new NextResponse("Unauthorized: Invalid token", { status: 401 });
  }
  const userId = decoded.sub;

  try {
    await deleteSessionToken(userId);
  } catch (error) {
    console.error("Token revoke error:", error);
    return NextResponse.json({ success: false }, { status: 500 })
  }
  return NextResponse.json({ success: true });
}
