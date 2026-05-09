// db/schema/apline.ts

import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { timestamps, timestampsWithDeletedAt } from "./columnsHelpers"

import { users } from "./users";
import {
  aplineBusinessLists,
  aplineCause,
  aplineClassification,
  aplineDeal,
  aplineEmergency,
  aplineImpact,
  aplinePriority,
  aplineRequestCategory,
  aplineSeverity,
  aplineStatus,
  aplineSubsystem,
} from "./aplineMasters";

import { aplineFileStore, userUnreadArticles } from "./aplineSubTables";

// ─────────────────────────────────────────────
// テーブル定義
// ─────────────────────────────────────────────
export const aplineBase = sqliteTable("apline_base", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  apid: text("apid").unique(),
  title: text("title"),
  statusId: integer("status_id").default(0),
  organization: text("organization"),
  responsible: text("responsible"),
  workContent: text("work_content"),
  surveyResults: text("survey_results"),
  dealAnswer: text("deal_answer"),
  reception: text("reception"),
  workStartTime: text("work_start_time"),
  workEndTime: text("work_end_time"),
  occurrenceDate: text("occurrence_date"),
  customerImpact: text("customer_impact"),
  correspondingNote: text("corresponding_note"),
  mailFlag: integer("mail_flag", { mode: "boolean" }).default(false),
  acceptanceId: integer("acceptance_id"),  // 受付者
  slipIssuanceId: integer("slip_issuance_id"), // 案件起票者
  itemUpdaterId: integer("item_updater_id"),  // 更新者
  requestCategoryId: integer("request_category_id"),
  classificationId: integer("classification_id").default(0),
  subsystemId: integer("subsystem_id").default(0),
  businessId: integer("business_id").default(0),
  emergencyId: integer("emergency_id").default(0),
  impactId: integer("impact_id").default(0),
  priorityId: integer("priority_id").default(0),
  causeId: integer("cause_id").default(0),
  dealId: integer("deal_id").default(0),
  severityId: integer("severity_id").default(0),
  ...timestamps
},
  (table) => [
    index("apline_base_search_index").on(
      table.apid,
      table.title,
      table.workContent,
      table.organization,
      table.surveyResults,
      table.dealAnswer,
      table.customerImpact,
      table.correspondingNote,
    ),
  ],
);

// ─────────────────────────────────────────────
// リレーション定義
// ─────────────────────────────────────────────
export const aplineBaseRelations = relations(
  aplineBase,
  ({ one, many }) => ({

    acceptanceUser: one(users, {
      fields: [aplineBase.acceptanceId],
      references: [users.id],
      relationName: "AcceptanceUser",
    }),
    slipIssuanceUser: one(users, {
      fields: [aplineBase.slipIssuanceId],
      references: [users.id],
      relationName: "SlipIssuanceUser",
    }),
    itemUpdaterUser: one(users, {
      fields: [aplineBase.itemUpdaterId],
      references: [users.id],
      relationName: "ItemUpdaterUser",
    }),

    status: one(aplineStatus, {
      fields: [aplineBase.statusId],
      references: [aplineStatus.id],
    }),
    business: one(aplineBusinessLists, {
      fields: [aplineBase.businessId],
      references: [aplineBusinessLists.id],
    }),
    cause: one(aplineCause, {
      fields: [aplineBase.causeId],
      references: [aplineCause.id],
    }),
    classification: one(aplineClassification, {
      fields: [aplineBase.classificationId],
      references: [aplineClassification.id],
    }),
    deal: one(aplineDeal, {
      fields: [aplineBase.dealId],
      references: [aplineDeal.id],
    }),
    emergency: one(aplineEmergency, {
      fields: [aplineBase.emergencyId],
      references: [aplineEmergency.id],
    }),
    impact: one(aplineImpact, {
      fields: [aplineBase.impactId],
      references: [aplineImpact.id],
    }),
    priority: one(aplinePriority, {
      fields: [aplineBase.priorityId],
      references: [aplinePriority.id],
    }),
    requestCategory: one(aplineRequestCategory, {
      fields: [aplineBase.requestCategoryId],
      references: [aplineRequestCategory.id],
    }),
    severity: one(aplineSeverity, {
      fields: [aplineBase.severityId],
      references: [aplineSeverity.id],
    }),
    subsystem: one(aplineSubsystem, {
      fields: [aplineBase.subsystemId],
      references: [aplineSubsystem.id],
    }),

    files: many(aplineFileStore),
    reads: many(userUnreadArticles),
  }),
);

// ─────────────────────────────────────────────
// 型エクスポート
// ─────────────────────────────────────────────
export type AplineBaseRow = typeof aplineBase.$inferSelect;
export type NewaplineBase = typeof aplineBase.$inferInsert;
export type CommonFields = Pick<AplineBaseRow,
  // テキスト系
  | "title"
  | "organization"
  | "responsible"
  | "workContent"
  | "surveyResults"
  | "dealAnswer"
  | "customerImpact"
  | "correspondingNote"
  // ID系
  | "statusId"
  | "causeId"
  | "classificationId"
  | "dealId"
  | "emergencyId"
  | "impactId"
  | "priorityId"
  | "requestCategoryId"
  | "severityId"
  | "subsystemId"
  | "businessId"
  | "itemUpdaterId" // 更新者(aplineId)
  // 日付系
  | "occurrenceDate"
  | "reception"
  | "workStartTime"
  | "workEndTime"
  // その他
  | "mailFlag"
>;

// マイグレーション用に sql タグで定義
export const ftsIndexCreate = sql`
  CREATE VIRTUAL TABLE IF NOT EXISTS fts_index
  USING fts5(
    apid ,
    title,
    body,
    tokenize = 'unicode61'
  )
`;