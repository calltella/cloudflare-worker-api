
/**
 * 添付ファイルのデータベース操作用API
 * GET ダウンロード
 * POST 新規登録
 * PATCH ファイル名変更
 * DELETE ファイル削除（R2ファイルは別で削除）
 * 
 */

import { requireAuth } from "@/lib/utils/auth";
import { NextRequest, NextResponse } from "next/server";
import { getAplineFileDownloadUrl } from "@/src/service/aplineSub.service";

export async function GET(request: NextRequest): Promise<Response> {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
  try {
    const { searchParams } = request.nextUrl;

    const downloadKey = searchParams.get("downloadKey");
    if (!downloadKey) {
      return NextResponse.json({ success: false, reason: "error", message: "downloadKey is required", }, { status: 400 });
    }

    return await getAplineFileDownloadUrl(downloadKey)
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "download failed", },
      { status: 500, }
    );
  }
}