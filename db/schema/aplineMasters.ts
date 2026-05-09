// src/db/schema/aplineMasters.ts
import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// ─────────────────────────────────────────────
// Cause
// ─────────────────────────────────────────────
export const aplineCause = sqliteTable("apline_cause", {
  id: integer("id").primaryKey(),
  cause: text("cause").notNull(),
  sortOrder: integer("sort_order").notNull(),
  available: integer("available", { mode: "boolean" }).default(true).notNull(),
});

// ─────────────────────────────────────────────
// Classification
// ─────────────────────────────────────────────
export const aplineClassification = sqliteTable("apline_classification", {
  id: integer("id").primaryKey(),
  classification: text("classification").notNull(),
  sortOrder: integer("sort_order").notNull(),
  available: integer("available", { mode: "boolean" }).default(true).notNull(),
});

// ─────────────────────────────────────────────
// Deal
// ─────────────────────────────────────────────
export const aplineDeal = sqliteTable("apline_deal", {
  id: integer("id").primaryKey(),
  deal: text("deal").notNull(),
  sortOrder: integer("sort_order").notNull(),
  available: integer("available", { mode: "boolean" }).default(true).notNull(),
});

// ─────────────────────────────────────────────
// Emergency
// ─────────────────────────────────────────────
export const aplineEmergency = sqliteTable("apline_emergency", {
  id: integer("id").primaryKey(),
  emergency: text("emergency").notNull(),
  sortOrder: integer("sort_order").notNull(),
  available: integer("available", { mode: "boolean" }).default(true).notNull(),
});

// ─────────────────────────────────────────────
// Impact
// ─────────────────────────────────────────────
export const aplineImpact = sqliteTable("apline_impact", {
  id: integer("id").primaryKey(),
  impact: text("impact").notNull(),
  sortOrder: integer("sort_order").notNull(),
  available: integer("available", { mode: "boolean" }).default(true).notNull(),
});

// ─────────────────────────────────────────────
// Priority
// ─────────────────────────────────────────────
export const aplinePriority = sqliteTable("apline_priority", {
  id: integer("id").primaryKey(),
  priority: text("priority").notNull(),
  sortOrder: integer("sort_order").notNull(),
  available: integer("available", { mode: "boolean" }).default(true).notNull(),
});

// ─────────────────────────────────────────────
// RequestCategory
// ─────────────────────────────────────────────
export const aplineRequestCategory = sqliteTable("apline_request_category", {
  id: integer("id").primaryKey(),
  requestCategory: text("category").notNull(),
  sortOrder: integer("order_no").notNull(),
  available: integer("available", { mode: "boolean" }).default(true).notNull(),
});

// ─────────────────────────────────────────────
// Severity
// ─────────────────────────────────────────────
export const aplineSeverity = sqliteTable("apline_severity", {
  id: integer("id").primaryKey(),
  severity: text("severity").notNull(),
  sortOrder: integer("sort_order").notNull(),
  available: integer("available", { mode: "boolean" }).default(true).notNull(),
});

// ─────────────────────────────────────────────
// Status
// ─────────────────────────────────────────────
export const aplineStatus = sqliteTable("apline_status", {
  id: integer("id").primaryKey(),
  status: text("status").notNull(),
  sortOrder: integer("order_no").notNull(),
  badgeColor: text("badge_color").notNull().default("gray"),
  available: integer("available", { mode: "boolean" }).default(true).notNull(),
});

// ─────────────────────────────────────────────
// Subsystem
// ─────────────────────────────────────────────
export const aplineSubsystem = sqliteTable("apline_subsystem", {
  id: integer("id").primaryKey(),
  subsystem: text("subsystem").notNull(),
  sortOrder: integer("sort_order").notNull(),
  available: integer("available", { mode: "boolean" }).default(true).notNull(),
});

// ─────────────────────────────────────────────
// BusinessLists
// ─────────────────────────────────────────────
export const aplineBusinessLists = sqliteTable("apline_business", {
  id: integer("id").primaryKey(),
  business: text("business").notNull(),
  sortOrder: integer("sort_order").notNull(),
  available: integer("available", { mode: "boolean" }).default(true).notNull(),
});

// ─────────────────────────────────────────────
// 型エクスポート
// ─────────────────────────────────────────────
export type AplineCause = typeof aplineCause.$inferSelect;
export type AplineClassification = typeof aplineClassification.$inferSelect;
export type AplineDeal = typeof aplineDeal.$inferSelect;
export type AplineEmergency = typeof aplineEmergency.$inferSelect;
export type AplineImpact = typeof aplineImpact.$inferSelect;
export type AplinePriority = typeof aplinePriority.$inferSelect;
export type AplineRequestCategory = typeof aplineRequestCategory.$inferSelect;
export type AplineSeverity = typeof aplineSeverity.$inferSelect;
export type AplineStatus = typeof aplineStatus.$inferSelect;
export type AplineSubsystem = typeof aplineSubsystem.$inferSelect;
export type AplineBusinessLists = typeof aplineBusinessLists.$inferSelect;

