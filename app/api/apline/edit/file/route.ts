
/**
 * 添付ファイルのデータベース操作用API（R2操作は別のAPI）
 * GET ダウンロード
 * POST 新規登録
 * PATCH ファイル名変更
 * DELETE ファイル削除（R2ファイルは別で削除）
 * 
 */

import { requireAuth } from "@/lib/utils/auth";
import { NextRequest, NextResponse } from "next/server";
import { getAplineFileDownloadUrl, saveFileMetadata } from "@/src/service/aplineSub.service";
import type { UploadFileMeta } from "@/src/features/apline/types/ui";

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

type SaveFileMedata = {
  joinId: number;
  fileMeta: UploadFileMeta[];
  fileNames: string[];
  tempKey?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as SaveFileMedata;
  const { joinId, fileMeta, fileNames, tempKey = "" } = body;

  if (!joinId || !fileMeta || !fileNames) {
    return NextResponse.json({ success: false, message: "パラメータが不足しています" }, { status: 400 });
  }

  await saveFileMetadata(joinId, tempKey, fileMeta, fileNames);

  return NextResponse.json({ success: true });
}

