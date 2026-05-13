
import { requireAuth } from "@/lib/utils/auth";
import { uploadAvatarToR2, deleteAvatarToR2 } from "@/src/service/storage.service";
import { NextRequest, NextResponse } from "next/server";

/**
 * API機能
 * ファイルをアップロードする機能のみ
 * ファイルをアップロードする場所（Public or Private)
 * アップロードが成功したらファイルパスを払い出し
 * アップロードが失敗したらエラーを返す
 * 
 * 
 * 
 * @param req 
 * @returns 
 */
export async function POST(request: NextRequest) {

  // Token認証
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    const bucketType = formData.get("BucketType") as string | null;

    if (!file) {
      return new Response("file is required", { status: 400 });
    }

    const fileName = await uploadAvatarToR2(file)

    return NextResponse.json({
      success: true,
      fileName,
      bucketType,
    });
  } catch (err) {
    console.error(err);
    return new NextResponse("Upload failed", { status: 500 });
  }
}

// 削除 DELETE /notes/:id
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const { fileName } = body;

  if (!fileName) {
    return new NextResponse("fileName is required", { status: 400 });
  }
  console.log(`deleteFile: ${JSON.stringify(fileName)}`);
  const result = await deleteAvatarToR2(fileName);

  if (!result) {
    return new NextResponse("fileName not found", { status: 404 });
  }

  return NextResponse.json({ success: true, deleted: result });
}