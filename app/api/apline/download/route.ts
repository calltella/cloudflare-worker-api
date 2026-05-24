// app/api/apline/download/route.ts
import { requireAuth } from "@/lib/utils/auth";
import { NextRequest, NextResponse } from "next/server";
import { getR2 } from "@/lib/utils/r2";

export async function GET(request: NextRequest): Promise<NextResponse | Response> {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const { searchParams } = request.nextUrl;

  const key = searchParams.get("key");
  const fileName = searchParams.get("fileName");

  if (!key) {
    return NextResponse.json({ success: false, message: "keyがありません" }, { status: 400 });
  }
  if (!fileName) {
    return NextResponse.json({ success: false, message: "fileNameがありません" }, { status: 400 });
  }

  const r2 = await getR2("private");
  const object = await r2.get(key);

  if (!object || !object.body) {
    return NextResponse.json({ success: false, message: "ファイルが見つかりません" }, { status: 404 });
  }

  // ストリームをそのままクライアントに返す
  return new Response(object.body as unknown as BodyInit, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    },
  });
}