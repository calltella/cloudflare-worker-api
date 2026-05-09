// src/db/schema/aplineSubTables.ts
import { relations, sql } from "drizzle-orm";
import {
  integer,
  sqliteTable,
  text,
  unique,
  index,
} from "drizzle-orm/sqlite-core";

import { aplineBase } from "./aplineBase";
import { timestamps, timestampsWithDeletedAt } from "./columnsHelpers"
import { string } from "zod";

// ─────────────────────────────────────────────
// 店舗リスト
// ─────────────────────────────────────────────
export const aplinePulldownList = sqliteTable("apline_pulldown_list", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  groupNo: integer("group_no").notNull(),
  tencd: integer("tencd").notNull(),
  pulldownName: text("pulldown_name").notNull(),
  pgroongaSearchWord: text("pgroonga_search_word"),
  orderNo: integer("order_no").notNull(),
  registName: text("regist_name").notNull(),
  registOrder: integer("regist_order").notNull(),
  d1SerachWord: text("d1_search_word").notNull(),
});

// ─────────────────────────────────────────────
// 添付ファイル
// ─────────────────────────────────────────────
export const aplineFileStore = sqliteTable("apline_file_store", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  folder: text("folder").notNull(),
  filePath: text("file_path"), //.notNull(),
  fileName: text("file_name").notNull(),
  ext: text("ext").notNull(),
  size: integer("size").notNull(),
  md5Hash: text("md5_hash"),  // 同じファイルだと同じになる
  joinId: integer("join_id"), // aplibe_baseと紐付き
  downloadKey: text("download_key").notNull(),  // uuid(外部公開キー)
  tempKey: text("temp_key"), // １次管理ファイル(uuid)
  ...timestampsWithDeletedAt
});

export const aplineFileStoreRelations = relations(
  aplineFileStore,
  ({ one }) => ({
    apline: one(aplineBase, {
      fields: [aplineFileStore.joinId],
      references: [aplineBase.id],
    }),
  }),
);

// ─────────────────────────────────────────────
// お気に入り管理フラグ
// ─────────────────────────────────────────────
export const aplineFavorites = sqliteTable(
  "apline_favorites",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull(),
    articleId: integer("article_id").notNull(),
    ...timestampsWithDeletedAt
  },
  (table) => [
    unique().on(table.userId, table.articleId),
  ],
);

// ─────────────────────────────────────────────
// 記事編集ロック
// ─────────────────────────────────────────────
export const aplineArticleLocks = sqliteTable(
  "apline_article_locks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),

    // どの記事か
    articleId: integer("article_id").notNull(),

    // ロックしているユーザー(user.id)
    lockedBy: text("locked_by").notNull(),

    // ロック取得時刻
    lockedAt: integer("locked_at", { mode: "timestamp" }).notNull(),

    // 有効期限（タイムアウト）
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),

    // 明示的に解除されたか（強制解除）
    releasedAt: integer("released_at", { mode: "timestamp" }),

    // 任意：ロック理由やセッション識別
    lockToken: text("lock_token"), // タブ/セッション単位で使える

    ...timestamps,
  },
  (table) => [
    // 1記事につき「有効なロックは1つ」
    unique().on(table.articleId),

    index("idx_article_locks_article_id").on(table.articleId),
    index("idx_article_locks_expires_at").on(table.expiresAt),
  ]
);

// ─────────────────────────────────────────────
// ユーザー未読管理（新規投稿・更新された記事の管理）
// ─────────────────────────────────────────────
export const userUnreadArticles = sqliteTable(
  "user_unread_articles",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id"),   // aplineUserではなくloginUser(string)
    articleId: integer("article_id")
      .notNull()
      .references(() => aplineBase.id, { onDelete: "cascade" }),
    // なぜ未読になったか（更新なのか新規なのか）
    reason: text("reason"), // "created" | "updated"
    ...timestamps,
  },
  (table) => [
    unique("user_unread_unique").on(table.userId, table.articleId),
    index("idx_unread_user_id").on(table.userId),
    index("idx_unread_article_id").on(table.articleId),
  ]
);

// ─────────────────────────────────────────────
// 下書き（ドラフト機能）
// ─────────────────────────────────────────────
export const aplineDrafts = sqliteTable(
  "apline_drafts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull(),   // uuid 
    articleId: integer("article_id")     // aplibeBase Id
      .notNull()
      .references(() => aplineBase.id, { onDelete: "cascade" }),
    ...timestamps,
  },
);

// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// 型エクスポート
// ─────────────────────────────────────────────
export type aplinePulldownList = typeof aplinePulldownList.$inferSelect;
export type aplineFileStore = typeof aplineFileStore.$inferSelect;
export type aplineFavorites = typeof aplineFavorites.$inferSelect;
export type aplineArticleLocks = typeof aplineArticleLocks.$inferSelect;


// insert必要？
export type NewaplinePulldownList = typeof aplinePulldownList.$inferInsert;
export type NewaplineFileStore = typeof aplineFileStore.$inferInsert;
export type NewaplineFavorites = typeof aplineFavorites.$inferInsert;
export type NewaplineArticleLocks = typeof aplineArticleLocks.$inferInsert;


