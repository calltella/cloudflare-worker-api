// app/api/import/files/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/jwt";
import { insertAplineFilesData } from "@/src/service/aplineImportDatas.service";

export const runtime = "nodejs";
/**
 * 必要なレコード
 * folder: あってもなくてもいいが将来の拡張用
 * file_path: ファイル名だけでOK（拡張子つき）
 * file_name: リアルファイル名（ダウンロード用）
 * ext: 不要
 * size: サイズ（ポスグレをそのまま送信）
 * download_key: uuid(外部公開キー)
 * temp_key: 必要なし
 * created_at: リアル必要？
 * updated_at: リアル必要？
 * deleted_at: ポスグレ側で排除
 * 
 * @param req 
 * @returns 
 */

export async function POST(req: NextRequest) {
  try {
    // =========================
    // 認証
    // =========================
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const user = await verifyAccessToken(token);

    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    console.log(`認証OK`)

    // =========================
    // body取得
    // =========================
    const body = await req.json();

    console.log(`body: ${JSON.stringify(body)}`)
    if (!body?.data) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const inserted = await insertAplineFilesData({
      data: body.data,
    });

    console.log(`inserted: ${JSON.stringify(inserted)}`)

    return NextResponse.json({
      success: true,
      data: inserted,
    });


  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      { error: error.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}