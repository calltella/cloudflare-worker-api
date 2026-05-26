// lib/r2/constants.ts

export const R2_BUCKET_TYPES = {
  PUBLIC: "public",
  PRIVATE: "private",
} as const;

export type BucketType =
  (typeof R2_BUCKET_TYPES)[keyof typeof R2_BUCKET_TYPES];

export const R2_PREFIX = {
  public: "public",
  private: "private",
} as const;