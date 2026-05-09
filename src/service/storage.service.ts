
import { getR2 } from "@/lib/utils/r2";
import { randomUUID } from "crypto";

export async function uploadAvatarToR2(
  file: File
): Promise<string> {
  const ext = file.type === "image/png" ? "png" : "jpg";
  const fileName = `avatar_${randomUUID()}.${ext}`;

  const r2 = await getR2("public");

  await r2.put(`avatars/${fileName}`, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  return fileName; // ← DBにはフルURLではなくパスのみ保存
}

const DEFAULT_AVATAR = "default.png";

export async function deleteAvatarToR2(
  fileName: string | null | undefined
): Promise<boolean> {
  try {
    // ✅ 無効値ガード
    if (!fileName) return false;

    // ✅ default画像は削除しない
    if (fileName === DEFAULT_AVATAR) {
      console.log("Skip delete: default avatar");
      return false;
    }

    const r2 = await getR2("public");

    const key = `avatars/${fileName}`;

    await r2.delete(key);

    return true;
  } catch (error) {
    console.error("R2 delete error:", error);
    return false;
  }
}

// R2からのダウンロードURL取得
export async function getDownloadUrlFromR2(filePath: string, fileName: string): Promise<string> {
  // const command = new GetObjectCommand({
  //   Bucket: process.env.R2_BUCKET!,
  //   Key: filePath,
  //   ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`
  // });

  try {
    // const url = await getSignedUrl(r2ClientPrivate, command, { expiresIn: 3600 });
    // console.log("signed url:", url);
    return null as unknown as string; // URLを返す（実装は省略）
  } catch (err) {
    console.error("Error generating signed URL:", err);
    throw new Error("Could not generate download URL");
  }
}

// Worker環境からR2のダウンロードURLを取得
export async function getDownloadUrlFromWorkerR2(filePath: string, fileName: string): Promise<Response> {
  const r2 = await getR2("private");

  const object = await r2.get(filePath);

  if (!object || !object.body) {
    throw new Error("File not found in R2");
  }

  return new Response(object.body as unknown as BodyInit, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
