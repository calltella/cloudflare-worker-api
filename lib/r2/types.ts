// lib/r2/types.ts

import type { R2Bucket } from "@cloudflare/workers-types";

export type R2Buckets = {
  public: R2Bucket;
  private: R2Bucket;
};

export type UploadFileParams = {
  file: File;
  bucketType?: "public" | "private";
  userId: string;
  folder: UploadFolder;
};

export type UploadFileResult = {
  key: string;
  fileName: string;
  url: string | null;
};

export const UPLOAD_FOLDERS = ["avatar", "article", "report"] as const;
export type UploadFolder = typeof UPLOAD_FOLDERS[number];

export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const PUBLIC_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export const IMAGE_MIME_TYPE_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif"
};

export const PRIVATE_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
];