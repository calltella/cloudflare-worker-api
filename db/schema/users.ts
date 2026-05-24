// /app/db/schema/users.ts

import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { relations, sql } from "drizzle-orm";
import { timestampsWithDeletedAt } from "@/db/schema/columnsHelpers";
import { type UserRole } from "@/types/user";

export const users = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").unique().notNull(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url").default("default.png"),
  passwordHash: text("password_hash"),
  emailVerified: text("email_verified"),
  isActive: integer("is_active", { mode: 'boolean' }).notNull().default(true),
  role: text("role").$type<UserRole>().notNull(),
  ...timestampsWithDeletedAt
}, (t) => [
  index("name_idx").on(t.name),
  uniqueIndex("email_idx").on(t.email)
]);

// references = DBレベルの外部キー制約
// relations = DrizzleのORMレベルの関連定義（型・JOIN用）
export const userRelations = relations(users, ({ one }) => ({
  account: one(account, {
    fields: [users.id],
    references: [account.userId],
  }),
}));

export const userLoginRelations = relations(users, ({ one, many }) => ({
  account: one(account, {
    fields: [users.id],
    references: [account.userId],
  }),
  loginHistories: many(loginHistories),
}));

export const account = sqliteTable("account", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull()
    .unique()
    .references(() => users.id),
  type: text("type").notNull(),
  aplineUserId: integer("apline_user_id"), // users -> account -> aplineUsers
});

export const aplineUsers = sqliteTable("apline_users", {
  id: integer("id").primaryKey(), // ログインユーザー ＝ aplineUsers ではない (LoginUser < aplineUser)
  displayName: text("display_name").notNull(),
  displayNameShort: text("display_name_short").notNull()
})

// schemaからTypeを宣言（読み取り用）
export type User = typeof users.$inferSelect;

// schemaからTypeを宣言（書き込み用）
export type NewUser = typeof users.$inferInsert;

export const loginHistories = sqliteTable("login_histories", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  userId: text("user_id")
    .notNull()
    .references(() => users.id),

  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  country: text("country"),

  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),

}, (t) => [
  index("login_user_idx").on(t.userId),
  index("login_created_idx").on(t.createdAt)
]);

// schemaからTypeを宣言（書き込み用）
export type NewLoginHistory = typeof loginHistories.$inferInsert;

export const loginHistoryRelations = relations(loginHistories, ({ one }) => ({
  user: one(users, {
    fields: [loginHistories.userId],
    references: [users.id],
  }),
}));

// api用セッション管理
export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(), // refresh期限
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
