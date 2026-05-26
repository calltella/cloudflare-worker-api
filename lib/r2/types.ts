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
  folder?: string;
};

export type UploadFileResult = {
  key: string;
  fileName: string;
  url: string | null;
};