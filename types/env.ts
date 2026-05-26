// src/types/env.ts

import type { R2Bucket, D1Database, KVNamespace } from "@cloudflare/workers-types";

export type CloudflareBindings = {
  DB: D1Database;
  PUBLIC_BUCKET: R2Bucket;
  PRIVATE_BUCKET: R2Bucket;
  VERCEL_KV: KVNamespace;
};
