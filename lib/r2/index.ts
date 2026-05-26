// lib/r2/index.ts

import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { CloudflareBindings } from "@/types/env";
import type { R2Bucket, R2PutOptions, } from "@cloudflare/workers-types";
import { R2_BUCKET_TYPES, type BucketType, } from "@/lib/r2/constants";
import type { UploadFileParams, UploadFileResult } from "@/lib/r2/types";
import { IMAGE_MIME_TYPE_TO_EXT, PRIVATE_MIME_TYPES } from "@/lib/r2/types";


type R2Env = {
  PUBLIC_BUCKET: R2Bucket;
  PRIVATE_BUCKET: R2Bucket;
};

async function getEnv(): Promise<R2Env> {
  const context = await getCloudflareContext({
    async: true,
  });

  const env = context.env as unknown as CloudflareBindings;
  if (!env.PUBLIC_BUCKET) {
    throw new Error("PUBLIC_BUCKET binding not found");
  }

  if (!env.PRIVATE_BUCKET) {
    throw new Error("PRIVATE_BUCKET binding not found");
  }

  return {
    PUBLIC_BUCKET: env.PUBLIC_BUCKET,
    PRIVATE_BUCKET: env.PRIVATE_BUCKET,
  };
}

/**
 * R2 Bucket取得
 */
export async function getR2(
  type: BucketType = R2_BUCKET_TYPES.PRIVATE
): Promise<R2Bucket> {
  const env = await getEnv();

  switch (type) {
    case R2_BUCKET_TYPES.PUBLIC:
      return env.PUBLIC_BUCKET;

    case R2_BUCKET_TYPES.PRIVATE:
      return env.PRIVATE_BUCKET;

    default:
      throw new Error("Invalid bucket type");
  }
}

/**
 * key生成
 */
export function createR2Key(params: {
  fileName: string;
  folder: string;
}) {
  const { fileName, folder } = params;
  const parts = [folder, fileName];
  return parts.join("/");
}

/**
 * 拡張子を切り取り
 * @param filename 
 * @returns 
 */
function getExtension(filename: string) {
  const index = filename.lastIndexOf(".");

  if (index === -1) {
    return "";
  }

  return filename.slice(index);
}
function getExtensionFromFile(file: File): string {
  const fromName = getExtension(file.name);
  if (fromName) return fromName;

  // ファイル名に拡張子がなければMIMEタイプから補完
  return IMAGE_MIME_TYPE_TO_EXT[file.type] ?? "";
}

/**
 * upload
 */
export async function uploadFileToR2({
  file,
  bucketType = R2_BUCKET_TYPES.PRIVATE,
  userId,
  folder,
}: UploadFileParams): Promise<UploadFileResult> {
  const bucket = await getR2(bucketType);

  const extension = getExtensionFromFile(file);
  const fileName = `${crypto.randomUUID()}${extension}`;
  console.log(`fileName: ${fileName}`);

  const key = createR2Key({ fileName, folder });
  const arrayBuffer = await file.arrayBuffer();
  const options: R2PutOptions = {
    httpMetadata: {
      contentType: file.type,
    },

    customMetadata: {
      originalName: file.name,
      uploadedBy: userId,
    },
  };

  await bucket.put(key, arrayBuffer, options);

  return {
    key, fileName,
    url:
      bucketType === R2_BUCKET_TYPES.PUBLIC ? createPublicFileUrl(key) : null,
  };
}

/**
 * object取得
 */
export async function getR2Object(
  key: string,
  bucketType: BucketType = R2_BUCKET_TYPES.PRIVATE
) {
  const bucket = await getR2(bucketType);

  return bucket.get(key);
}

/**
 * object削除
 */
export async function deleteR2Object(
  key: string,
  bucketType: BucketType = R2_BUCKET_TYPES.PRIVATE
) {
  const bucket = await getR2(bucketType);

  await bucket.delete(key);
}

/**
 * Public URL生成
 */
export function createPublicFileUrl(
  key: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

  if (!baseUrl) {
    throw new Error(
      "NEXT_PUBLIC_PUBLIC_BUCKET_URL is missing"
    );
  }

  return `${baseUrl}/${key}`;
}