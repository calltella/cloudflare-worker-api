
import {
  account,
  users
} from "@/db/schema/users";
import {
  aplineBase
} from "@/db/schema/aplineBase";
import {
  aplinePulldownList,
  userUnreadArticles,
  aplineFileStore,
} from "@/db/schema/aplineSubTables";
import {
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
  aplineBusinessLists,
} from "@/db/schema/aplineMasters";

import { alias } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// query記法ではなくBuilder記法で書くのでネストにしない
// DB SELECT用の値
export const APLINE_PULLDOWN_SELECT = {
  id: aplinePulldownList.id,
  tencd: aplinePulldownList.tencd,
  pulldownName: aplinePulldownList.pulldownName,
  registName: aplinePulldownList.registName
} as const;

// リスト用（必要なカラムのみ）
export const APLINE_LIST_SELECT = {
  id: aplineBase.id,
  title: aplineBase.title,
  apid: aplineBase.apid,
  organization: aplineBase.organization,
  responsible: aplineBase.responsible,
  workContent: aplineBase.workContent,
  statusId: aplineStatus.id,
  status: aplineStatus.status,

  acceptanceUserId: aplineBase.acceptanceId,
  acceptanceUserName: users.name,
  acceptanceAplineUserId: account.aplineUserId,

  mailFlag: aplineBase.mailFlag,
  occurrenceDate: aplineBase.occurrenceDate,
  updatedAt: aplineBase.updatedAt,

  isUnread: sql<boolean>`
  ${userUnreadArticles.userId} IS not NULL
`.as("isUnread"),
} as const; // readonly化

// users.id はuuid
export const acceptanceUser = alias(account, "acceptanceUser");
export const slipIssuanceUser = alias(account, "slipIssuanceUser");
export const itemUpdaterUser = alias(account, "itemUpdaterUser");

export const APLINE_MODAL_SELECT = {
  id: aplineBase.id,
  title: aplineBase.title,
  apid: aplineBase.apid,
  organization: aplineBase.organization,
  responsible: aplineBase.responsible,
  workContent: aplineBase.workContent,
  surveyResults: aplineBase.surveyResults,
  dealAnswer: aplineBase.dealAnswer,
  reception: aplineBase.reception,
  workStartTime: aplineBase.workStartTime,
  workEndTime: aplineBase.workEndTime,
  occurrenceDate: aplineBase.occurrenceDate,
  customerImpact: aplineBase.customerImpact,
  correspondingNote: aplineBase.correspondingNote,
  mailFlag: aplineBase.mailFlag,

  statusId: aplineStatus.id,
  status: aplineStatus.status,
} as const; // readonly化

// 詳細用
export const APLINE_DETAIL_SELECT = {
  id: aplineBase.id,
  apid: aplineBase.apid,
  title: aplineBase.title,
  organization: aplineBase.organization,
  responsible: aplineBase.responsible,
  workContent: aplineBase.workContent,
  surveyResults: aplineBase.surveyResults,
  dealAnswer: aplineBase.dealAnswer,
  reception: aplineBase.reception,
  workStartTime: aplineBase.workStartTime,
  workEndTime: aplineBase.workEndTime,
  occurrenceDate: aplineBase.occurrenceDate,
  customerImpact: aplineBase.customerImpact,
  correspondingNote: aplineBase.correspondingNote,
  mailFlag: aplineBase.mailFlag,
  statusId: aplineBase.statusId,
  acceptanceId: aplineBase.acceptanceId,
  slipIssuanceId: aplineBase.slipIssuanceId,
  itemUpdaterId: aplineBase.itemUpdaterId,
  requestCategoryId: aplineBase.requestCategoryId,
  classificationId: aplineBase.classificationId,
  subsystemId: aplineBase.subsystemId,
  businessId: aplineBase.businessId,
  emergencyId: aplineBase.emergencyId,
  impactId: aplineBase.impactId,
  priorityId: aplineBase.priorityId,
  causeId: aplineBase.causeId,
  dealId: aplineBase.dealId,
  severityId: aplineBase.severityId,
} as const; // readonly化



