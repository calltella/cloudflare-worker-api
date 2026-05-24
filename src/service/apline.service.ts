// src/service/apline.service.ts

"use server";

import { auth } from "@/lib/auth.config";
import { getDB } from "@/lib/utils/db";
import * as dz from "drizzle-orm";

import { aplineBase } from "@/db/schema/aplineBase";
import * as aplineSchema from "@/db/schema/aplineMasters";
import * as atbl from "@/db/schema/aplineSubTables";

import { getAplineTenpoLists } from "@/src/service/aplineSub.service";

import { users, account, aplineUsers } from "@/db/schema";
import { getNow, getExpiresAt } from "@/lib/utils/date";
import { getUserWithAccount, getOtherUsers } from "@/src/service/user.service";


import type { AplineListDTO, AplineDetailListDTO, AplineSingleDTO } from "@/src/features/apline/types/ui";
import { redirect } from "next/navigation";
import { tokenize } from "@/lib/utils/tokenize";

import { AplineSearchParams } from "@/src/features/apline/types/searchParams"


/**
 * apline関連のサービス関数をまとめたファイル
 * fetchAplineList(params: GetAplineListViewsParams)  // 概要リスト取得
 * fetchAplineDetailList(params: GetAplineListViewsParams) // 詳細リスト取得
 * fetchAplineSingle(id: number): Promise<AplineSingleDTO | null> // 個別1件取得
 * deleteAplineById(articleId: number): Promise<boolean> 
 * markArticleAsRead(articleId: number)
 * getAplineSelectItems()
 * updateDraftAplineBase(id: number)
 * insertUserUnreadArticles(  articleId: number,  reason: 'created' | 'updated'
 * getAplineArticleLock(articleId: number) 
 * forceUnlockAplineLockAction(articleId: number)
 * toggleAplineFavorite(articleId: number)
 */

// =============================================================
// 型定義
// =============================================================

export type GetAplineListViewsParams = {
  userId: string;
  currentPage: number;
  shopId?: number;
  keyword?: string;
  pageSize: number;
  unread?: boolean;
  incomplete?: boolean;
};

// aliasテーブル
const acceptanceUser = dz.aliasedTable(aplineUsers, "acceptanceUser");
const updaterUser = dz.aliasedTable(aplineUsers, "updaterUser");

/** 概要リスト用DTO（既存） */
// export type AplineListDTO = {
//   id: number;
//   title: string;
//   apid: string;
//   organization: string;
//   responsible: string;
//   workContent: string;
//   dealAnswer: string;
//   statusId: number;
//   status: string;
//   acceptanceUserId: string;
//   acceptanceUserName: string;
//   acceptanceAplineUserId: string;
//   mailFlag: boolean;
//   occurrenceDate: string;
//   updatedAt: string;
//   favorite: boolean;
//   isUnread: boolean;
//   files: { id: number; fileName: string; downloadKey: string }[];
// };

/** 詳細リスト用DTO（概要 + 追加フィールド） */
// export type AplineDetailListDTO = AplineListDTO & {
//   surveyResults: string;
//   customerImpact: string;
//   correspondingNote: string;
// };

/** 個別取得用DTO（詳細リストと同じ構造でOK、必要に応じて拡張） */
//export type AplineSingleDTO = AplineDetailListDTO;
// export type AplineSingleDTO = AplineDetailListDTO & {
//   requestCategoryId: number;
//   classificationId: number;
//   subsystemId: number;
//   businessId: number;
//   severityId: number;
//   emergencyId: number;
//   impactId: number;
//   priorityId: number;
//   causeId: number;
//   dealId: number;

//   reception: string;
//   workStartTime: string;
//   workEndTime: string;
// };

// =============================================================
// 共通：ファイル取得
// =============================================================

async function fetchFileMap(ids: number[]) {
  if (ids.length === 0) return new Map<number, { id: number; fileName: string; downloadKey: string }[]>();

  const db = await getDB();

  const files = await db
    .select({
      id: atbl.aplineFileStore.id,
      fileName: atbl.aplineFileStore.fileName,
      joinId: atbl.aplineFileStore.joinId,
      downloadKey: atbl.aplineFileStore.downloadKey,
    })
    .from(atbl.aplineFileStore)
    .where(dz.inArray(atbl.aplineFileStore.joinId, ids));

  const fileMap = new Map<number, { id: number; fileName: string; downloadKey: string }[]>();

  for (const file of files) {
    if (!file.joinId) continue;
    if (!fileMap.has(file.joinId)) fileMap.set(file.joinId, []);
    fileMap.get(file.joinId)!.push({
      id: file.id,
      fileName: file.fileName,
      downloadKey: file.downloadKey,
    });
  }

  return fileMap;
}

// =============================================================
// 共通：WHERE条件構築
// =============================================================

async function buildAplineConditions(
  params: Omit<GetAplineListViewsParams, "currentPage" | "pageSize">,
) {
  const { userId, shopId, keyword, unread, incomplete } = params;
  const db = await getDB();
  const conditions = [dz.isNotNull(aplineBase.apid)];

  // キーワード
  if (keyword && keyword.trim() !== "") {
    const keywordQuery = tokenize(String(keyword));
    conditions.push(
      dz.sql.raw(`
        apline_base.id IN (
          SELECT rowid FROM fts_index WHERE fts_index MATCH '${keywordQuery}'
        )
      `)
    );
    console.log(`keyword: ${keyword}, tokenized: ${keywordQuery}`);
  }

  // 未読
  if (unread) {
    conditions.push(dz.sql`
      EXISTS (
        SELECT 1 FROM ${atbl.userUnreadArticles}
        WHERE
          ${atbl.userUnreadArticles.articleId} = ${aplineBase.id}
        AND
          ${atbl.userUnreadArticles.userId} = ${userId}
      )
    `);
  }

  // 未完了
  if (incomplete) {
    conditions.push(
      dz.notInArray(aplineBase.statusId, [5, 6])
    );
  }

  // 店舗
  if (shopId) {
    const shop = await db
      .select({ word: atbl.aplinePulldownList.d1SerachWord })
      .from(atbl.aplinePulldownList)
      .where(dz.eq(atbl.aplinePulldownList.id, shopId))
      .limit(1)
      .then((r) => r[0]);

    if (shop?.word) {
      const words: string[] = JSON.parse(shop.word);
      const orConditions = words.map((word) =>
        dz.like(aplineBase.organization, `%${word}%`)
      );
      const orCondition = dz.or(...orConditions);
      if (orCondition) conditions.push(orCondition);
    }
  }

  return conditions;
}

// =============================================================
// 共通：joinチェーン（全関数で共通）
// =============================================================

function buildBaseQuery(db: Awaited<ReturnType<typeof getDB>>, userId: string) {
  return db
    .select // ← ここだけ呼び出し元で差し替える
    .bind(db)({} as any) // 便宜上。実際は下記のように各関数内でselectを直書きする
    .from(aplineBase)
    .leftJoin(aplineSchema.aplineStatus, dz.eq(aplineBase.statusId, aplineSchema.aplineStatus.id))
    .leftJoin(account, dz.eq(account.aplineUserId, aplineBase.acceptanceId))
    .leftJoin(users, dz.eq(users.id, account.userId))
    .leftJoin(
      atbl.aplineFavorites,
      dz.and(
        dz.eq(atbl.aplineFavorites.articleId, aplineBase.id),
        dz.eq(atbl.aplineFavorites.userId, userId)
      )
    )
    .leftJoin(
      atbl.userUnreadArticles,
      dz.and(
        dz.eq(atbl.userUnreadArticles.articleId, aplineBase.id),
        dz.eq(atbl.userUnreadArticles.userId, userId)
      )
    );
}

// ※ drizzle-ormのselectはメソッドチェーンの都合上、
//   joinだけを共通化するのは型推論が壊れるため、
//   実用上は下記のように「selectフィールド定義だけ共通化」する方が現実的です。

// =============================================================
// 共通：selectフィールド定義
// =============================================================

/** 概要用フィールド */
const listSelectFields = (userId: string) => ({
  id: aplineBase.id,
  title: aplineBase.title,
  apid: aplineBase.apid,
  organization: aplineBase.organization,
  responsible: aplineBase.responsible,
  workContent: aplineBase.workContent,
  dealAnswer: aplineBase.dealAnswer,
  statusId: aplineBase.statusId,
  status: aplineSchema.aplineStatus.status,
  acceptanceUserId: aplineBase.acceptanceId,
  workStartTime: aplineBase.workStartTime,
  workEndtime: aplineBase.workEndTime,
  updatedAt: aplineBase.updatedAt,

  mailFlag: dz.sql<boolean>`COALESCE(${aplineBase.mailFlag}, false)`,
  occurrenceDate: aplineBase.occurrenceDate,

  favorite: dz.sql<boolean>`${atbl.aplineFavorites.id} IS NOT NULL`.as("favorite"),
  isUnread: dz.sql<boolean>`${atbl.userUnreadArticles.articleId} IS NOT NULL`.as("isUnread"),
  surveyResults: dz.sql<string>`COALESCE(${aplineBase.surveyResults}, '')`,
  customerImpact: dz.sql<string>`COALESCE(${aplineBase.customerImpact}, '')`,
  correspondingNote: dz.sql<string>`COALESCE(${aplineBase.correspondingNote}, '')`,

});

/** 詳細用フィールド（概要 + 追加3項目） */
const detailSelectFields = (userId: string) => ({
  ...listSelectFields(userId),
  surveyResults: dz.sql<string>`COALESCE(${aplineBase.surveyResults}, '')`,
  customerImpact: dz.sql<string>`COALESCE(${aplineBase.customerImpact}, '')`,
  correspondingNote: dz.sql<string>`COALESCE(${aplineBase.correspondingNote}, '')`,
});

/** 編集用フィールド（概要 + 追加3項目） */
const singleSelectFields = (userId: string) => ({
  ...detailSelectFields(userId),
  requestCategoryId: dz.sql<number>`COALESCE(${aplineBase.requestCategoryId}, 0)`,
  classificationId: dz.sql<number>`COALESCE(${aplineBase.classificationId}, 0)`,
  subsystemId: dz.sql<number>`COALESCE(${aplineBase.subsystemId}, 0)`,
  businessId: dz.sql<number>`COALESCE(${aplineBase.businessId}, 0)`,
  severityId: dz.sql<number>`COALESCE(${aplineBase.severityId}, 0)`,
  emergencyId: dz.sql<number>`COALESCE(${aplineBase.emergencyId}, 0)`,
  impactId: dz.sql<number>`COALESCE(${aplineBase.impactId}, 0)`,
  priorityId: dz.sql<number>`COALESCE(${aplineBase.priorityId}, 0)`,
  causeId: dz.sql<number>`COALESCE(${aplineBase.causeId}, 0)`,
  dealId: dz.sql<number>`COALESCE(${aplineBase.dealId}, 0)`,
  reception: dz.sql<string>`COALESCE(${aplineBase.reception}, '')`,
  workStartTime: dz.sql<string>`COALESCE(${aplineBase.workStartTime}, '')`,
  workEndTime: dz.sql<string>`COALESCE(${aplineBase.workEndTime}, '')`,
  acceptanceId: dz.sql<number>`COALESCE(${aplineBase.acceptanceId}, 0)`, // 削除で利用
});

// =============================================================
// 1. 概要リスト取得（既存）
// =============================================================

export async function fetchAplineList(params: GetAplineListViewsParams) {
  // const session = await auth();
  // if (!session?.user?.id) throw new Error("Not authenticated");

  const db = await getDB();
  const { userId, currentPage, pageSize } = params;
  const conditions = await buildAplineConditions(params);

  const resultsRaw = await db
    .select({
      ...listSelectFields(userId),
      // aliasが必要なテーブルは直接書く
      acceptanceUserName: acceptanceUser.displayName,
      updateUserName: updaterUser.displayName,
    })
    .from(aplineBase)
    .leftJoin(aplineSchema.aplineStatus, dz.eq(aplineBase.statusId, aplineSchema.aplineStatus.id))
    .leftJoin(acceptanceUser, dz.eq(acceptanceUser.id, aplineBase.acceptanceId))
    .leftJoin(updaterUser, dz.eq(updaterUser.id, aplineBase.itemUpdaterId))
    .leftJoin(atbl.aplineFavorites, dz.and(dz.eq(atbl.aplineFavorites.articleId, aplineBase.id), dz.eq(atbl.aplineFavorites.userId, userId)))
    .leftJoin(atbl.userUnreadArticles, dz.and(dz.eq(atbl.userUnreadArticles.articleId, aplineBase.id), dz.eq(atbl.userUnreadArticles.userId, userId)))
    .where(dz.and(...conditions))
    .orderBy(dz.desc(aplineBase.id))
    .limit(pageSize)
    .offset((currentPage - 1) * pageSize);

  const fileMap = await fetchFileMap(resultsRaw.map((v) => v.id));

  const results: AplineListDTO[] = resultsRaw.map((v) => ({
    ...v,
    files: fileMap.get(v.id) ?? [],
  }));

  const totalCountResult = await db
    .select({ count: dz.sql<number>`count(*)` })
    .from(aplineBase)
    .where(dz.and(...conditions));

  return {
    currentPage,
    aplineDatas: results,
    totalPages: Math.ceil((totalCountResult[0]?.count ?? 0) / pageSize),
  };
}

// =============================================================
// 2. 詳細リスト取得（新規）
//    概要との違い：detailSelectFields を使うだけ
// =============================================================

export async function fetchAplineDetailList(params: GetAplineListViewsParams) {
  // const session = await auth();
  // if (!session?.user?.id) throw new Error("Not authenticated");

  const db = await getDB();
  const { userId, currentPage, pageSize } = params;
  const conditions = await buildAplineConditions(params);

  const resultsRaw = await db
    .select({
      ...detailSelectFields(userId),
      // aliasが必要なテーブルは直接書く
      acceptanceUserName: acceptanceUser.displayName,
      updateUserName: updaterUser.displayName,
    })
    .from(aplineBase)
    .leftJoin(aplineSchema.aplineStatus, dz.eq(aplineBase.statusId, aplineSchema.aplineStatus.id))
    .leftJoin(account, dz.eq(account.aplineUserId, aplineBase.acceptanceId))
    .leftJoin(acceptanceUser, dz.eq(acceptanceUser.id, aplineBase.acceptanceId))
    .leftJoin(updaterUser, dz.eq(updaterUser.id, aplineBase.itemUpdaterId))
    .leftJoin(users, dz.eq(users.id, account.userId))
    .leftJoin(atbl.aplineFavorites, dz.and(dz.eq(atbl.aplineFavorites.articleId, aplineBase.id), dz.eq(atbl.aplineFavorites.userId, userId)))
    .leftJoin(atbl.userUnreadArticles, dz.and(dz.eq(atbl.userUnreadArticles.articleId, aplineBase.id), dz.eq(atbl.userUnreadArticles.userId, userId)))
    .where(dz.and(...conditions))
    .orderBy(dz.desc(aplineBase.id))
    .limit(pageSize)
    .offset((currentPage - 1) * pageSize);

  const fileMap = await fetchFileMap(resultsRaw.map((v) => v.id));

  const results: AplineDetailListDTO[] = resultsRaw.map((v) => ({
    ...v,
    files: fileMap.get(v.id) ?? [],
  }));

  const totalCountResult = await db
    .select({ count: dz.sql<number>`count(*)` })
    .from(aplineBase)
    .where(dz.and(...conditions));

  return {
    currentPage,
    aplineDatas: results,
    totalPages: Math.ceil((totalCountResult[0]?.count ?? 0) / pageSize),
  };
}

// =============================================================
// 3. 個別1件取得（新規）
//    ページネーション・count不要、idで1件だけ取得
// =============================================================

export async function fetchAplineSingle(userId: string, id: number): Promise<AplineSingleDTO> {

  const db = await getDB();

  const resultsRaw = await db
    .select({ // 詳細フィールド流用
      ...singleSelectFields(userId),
      // aliasが必要なテーブルは直接書く
      acceptanceUserName: acceptanceUser.displayName,
      updateUserName: updaterUser.displayName,
    })
    .from(aplineBase)
    .leftJoin(aplineSchema.aplineStatus, dz.eq(aplineBase.statusId, aplineSchema.aplineStatus.id))
    .leftJoin(account, dz.eq(account.aplineUserId, aplineBase.acceptanceId))
    .leftJoin(users, dz.eq(users.id, account.userId))
    .leftJoin(acceptanceUser, dz.eq(acceptanceUser.id, aplineBase.acceptanceId))
    .leftJoin(updaterUser, dz.eq(updaterUser.id, aplineBase.itemUpdaterId))
    .leftJoin(atbl.aplineFavorites, dz.and(dz.eq(atbl.aplineFavorites.articleId, aplineBase.id), dz.eq(atbl.aplineFavorites.userId, userId)))
    .leftJoin(atbl.userUnreadArticles, dz.and(dz.eq(atbl.userUnreadArticles.articleId, aplineBase.id), dz.eq(atbl.userUnreadArticles.userId, userId)))
    .where(dz.eq(aplineBase.id, id)) // ← idで1件に絞るだけ
    .limit(1);

  const raw = resultsRaw[0];
  if (!raw) throw new Error(`apline record not found: id=${id}`);

  const fileMap = await fetchFileMap([raw.id]);

  return {
    ...raw,
    files: fileMap.get(raw.id) ?? [],
  };
}

// =============================================================
// 4. エクスポート用全件取得（新規）By jules
// =============================================================
export type GetAplineExportDatasParams = {
  userId: string;
  currentPage: number;
  shopId?: number;
  keyword?: string;
  pageSize: number;
  unread?: boolean;
  incomplete?: boolean;
};

export async function fetchAllAplineForExport(params: {
  fromDate: string;
  toDate: string;
}) {
  const db = await getDB();

  const from = `${params.fromDate.slice(0, 4)}-${params.fromDate.slice(4, 6)}-${params.fromDate.slice(6, 8)} 00:00:00`;

  const to = `${params.toDate.slice(0, 4)}-${params.toDate.slice(4, 6)}-${params.toDate.slice(6, 8)} 23:59:59`;

  const results = await db
    .select(exportSelectFields())
    .from(aplineBase)
    .leftJoin(
      aplineSchema.aplineStatus,
      dz.eq(aplineBase.statusId, aplineSchema.aplineStatus.id)
    )
    .leftJoin(
      aplineSchema.aplineRequestCategory,
      dz.eq(
        aplineBase.requestCategoryId,
        aplineSchema.aplineRequestCategory.id
      )
    )
    .leftJoin(
      aplineSchema.aplineClassification,
      dz.eq(
        aplineBase.classificationId,
        aplineSchema.aplineClassification.id
      )
    )
    .leftJoin(
      aplineSchema.aplineSubsystem,
      dz.eq(aplineBase.subsystemId, aplineSchema.aplineSubsystem.id)
    )
    .leftJoin(
      aplineSchema.aplineBusinessLists,
      dz.eq(aplineBase.businessId, aplineSchema.aplineBusinessLists.id)
    )
    .leftJoin(
      aplineSchema.aplineSeverity,
      dz.eq(aplineBase.severityId, aplineSchema.aplineSeverity.id)
    )
    .leftJoin(
      aplineSchema.aplineEmergency,
      dz.eq(aplineBase.emergencyId, aplineSchema.aplineEmergency.id)
    )
    .leftJoin(
      aplineSchema.aplineImpact,
      dz.eq(aplineBase.impactId, aplineSchema.aplineImpact.id)
    )
    .leftJoin(
      aplineSchema.aplinePriority,
      dz.eq(aplineBase.priorityId, aplineSchema.aplinePriority.id)
    )
    .leftJoin(
      aplineSchema.aplineCause,
      dz.eq(aplineBase.causeId, aplineSchema.aplineCause.id)
    )
    .leftJoin(
      aplineSchema.aplineDeal,
      dz.eq(aplineBase.dealId, aplineSchema.aplineDeal.id)
    )
    .leftJoin(account, dz.eq(account.aplineUserId, aplineBase.acceptanceId))
    .leftJoin(users, dz.eq(users.id, account.userId))
    .leftJoin(
      aplineUsers,
      dz.eq(aplineUsers.id, aplineBase.slipIssuanceId)
    )
    .where(
      dz.and(
        dz.gte(aplineBase.workStartTime, from),
        dz.lte(aplineBase.workStartTime, to)
      )
    )
    .limit(10)
    .orderBy(dz.desc(aplineBase.id));

  return results;
}

/** エクスポート用フィールド（全項目 + マスター名）By jules */
const exportSelectFields = () => ({
  id: aplineBase.id,
  apid: aplineBase.apid,
  title: aplineBase.title,
  status: aplineSchema.aplineStatus.status,
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
  mailFlag: dz.sql<string>`CASE WHEN ${aplineBase.mailFlag} THEN 'あり' ELSE 'なし' END`,
  acceptanceUserName: users.name,
  slipIssuanceUserName: aplineUsers.displayName,
  itemUpdaterUserName: dz.sql<string>`(SELECT display_name FROM apline_users WHERE id = ${aplineBase.itemUpdaterId})`,
  requestCategory: aplineSchema.aplineRequestCategory.requestCategory,
  classification: aplineSchema.aplineClassification.classification,
  subsystem: aplineSchema.aplineSubsystem.subsystem,
  business: aplineSchema.aplineBusinessLists.business,
  emergency: aplineSchema.aplineEmergency.emergency,
  impact: aplineSchema.aplineImpact.impact,
  priority: aplineSchema.aplinePriority.priority,
  cause: aplineSchema.aplineCause.cause,
  deal: aplineSchema.aplineDeal.deal,
  severity: aplineSchema.aplineSeverity.severity,
  createdAt: aplineBase.createdAt,
  updatedAt: aplineBase.updatedAt,
});


export async function deleteAplineById(userId: string, articleId: number): Promise<boolean> {

  const authUser = await getUserWithAccount(userId);
  if (!authUser.aplineUserId) {
    throw new Error("Invalid user");
  }
  const db = await getDB();
  // ロック中、他人の書いた記事は削除できない仕様
  const deleted = await db
    .delete(aplineBase)
    .where(
      dz.and(
        dz.eq(aplineBase.id, articleId),
        dz.eq(aplineBase.acceptanceId, authUser.aplineUserId)
      )
    )
    .returning({ id: aplineBase.id });

  // 未読レコードを削除
  await db.delete(atbl.userUnreadArticles).where(dz.eq(atbl.userUnreadArticles.articleId, articleId));

  return deleted.length > 0;
}

// 未読を既読にする処理
export async function markArticleAsRead(articleId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  const db = await getDB();

  const [accountRow] = await db
    .select({ aplineUserId: account.aplineUserId })
    .from(account)
    .where(dz.eq(account.userId, session?.user.id));

  if (!accountRow) {
    throw new Error("Apline user not found");
  }
  const result = await db
    .delete(atbl.userUnreadArticles)
    .where(
      dz.and(
        dz.eq(atbl.userUnreadArticles.userId, session.user.id),
        dz.eq(atbl.userUnreadArticles.articleId, articleId)
      )
    ).returning();
  return result.length > 0;
}

// 入力作業に必要なデータをまとめて取得する関数
export async function getAplineSelectItems() {
  const db = await getDB();

  const [
    aplineStatus,
    aplineCause,
    aplineClassification,
    aplineDeal,
    aplineEmergency,
    aplineImpact,
    aplinePriority,
    aplineRequestCategory,
    aplineSeverity,
    aplineSubsystem,
    aplineBusinessLists,] = await Promise.all([
      db.select({ id: aplineSchema.aplineStatus.id, label: aplineSchema.aplineStatus.status }).from(aplineSchema.aplineStatus).where(dz.eq(aplineSchema.aplineStatus.available, true)).orderBy(aplineSchema.aplineStatus.sortOrder),
      db.select({ id: aplineSchema.aplineCause.id, label: aplineSchema.aplineCause.cause }).from(aplineSchema.aplineCause).where(dz.eq(aplineSchema.aplineCause.available, true)).orderBy(aplineSchema.aplineCause.sortOrder),
      db.select({ id: aplineSchema.aplineClassification.id, label: aplineSchema.aplineClassification.classification }).from(aplineSchema.aplineClassification).where(dz.eq(aplineSchema.aplineClassification.available, true)).orderBy(aplineSchema.aplineClassification.sortOrder),
      db.select({ id: aplineSchema.aplineDeal.id, label: aplineSchema.aplineDeal.deal }).from(aplineSchema.aplineDeal).where(dz.eq(aplineSchema.aplineDeal.available, true)).orderBy(aplineSchema.aplineDeal.sortOrder),
      db.select({ id: aplineSchema.aplineEmergency.id, label: aplineSchema.aplineEmergency.emergency }).from(aplineSchema.aplineEmergency).where(dz.eq(aplineSchema.aplineEmergency.available, true)).orderBy(aplineSchema.aplineEmergency.sortOrder),
      db.select({ id: aplineSchema.aplineImpact.id, label: aplineSchema.aplineImpact.impact }).from(aplineSchema.aplineImpact).where(dz.eq(aplineSchema.aplineImpact.available, true)).orderBy(aplineSchema.aplineImpact.sortOrder),
      db.select({ id: aplineSchema.aplinePriority.id, label: aplineSchema.aplinePriority.priority }).from(aplineSchema.aplinePriority).where(dz.eq(aplineSchema.aplinePriority.available, true)).orderBy(aplineSchema.aplinePriority.sortOrder),
      db.select({ id: aplineSchema.aplineRequestCategory.id, label: aplineSchema.aplineRequestCategory.requestCategory }).from(aplineSchema.aplineRequestCategory).where(dz.eq(aplineSchema.aplineRequestCategory.available, true)).orderBy(aplineSchema.aplineRequestCategory.sortOrder),
      db.select({ id: aplineSchema.aplineSeverity.id, label: aplineSchema.aplineSeverity.severity }).from(aplineSchema.aplineSeverity).where(dz.eq(aplineSchema.aplineSeverity.available, true)).orderBy(aplineSchema.aplineSeverity.sortOrder),
      db.select({ id: aplineSchema.aplineSubsystem.id, label: aplineSchema.aplineSubsystem.subsystem }).from(aplineSchema.aplineSubsystem).where(dz.eq(aplineSchema.aplineSubsystem.available, true)).orderBy(aplineSchema.aplineSubsystem.sortOrder),
      db.select({ id: aplineSchema.aplineBusinessLists.id, label: aplineSchema.aplineBusinessLists.business }).from(aplineSchema.aplineBusinessLists).where(dz.eq(aplineSchema.aplineBusinessLists.available, true)).orderBy(aplineSchema.aplineBusinessLists.sortOrder),
    ]);

  const tenpoLists = await getAplineTenpoLists();
  return {
    aplineStatus,
    aplineCause,
    aplineClassification,
    aplineDeal,
    aplineEmergency,
    aplineImpact,
    aplinePriority,
    aplineRequestCategory,
    aplineSeverity,
    aplineSubsystem,
    aplineBusinessLists,
    tenpoLists,
  };
}

// aplineBaseから新しいidを採番する関数(例:FSAS012554 のような形式)
export async function generateNewApid() {
  const db = await getDB();
  const result = await db
    .select({ maxApid: dz.sql<string>`MAX(apid)` })
    .from(aplineBase)
    .where(dz.sql`apid LIKE 'FSAS%'`)
    .limit(1);

  const maxApid = result[0]?.maxApid;
  if (!maxApid) {
    return "";  // D1側ではnullになります
  }

  const numericPart = parseInt(maxApid.replace("FSAS", ""), 10); // 10進数で変換
  const newNumericPart = numericPart + 1;
  return `FSAS${newNumericPart.toString().padStart(6, "0")}`;
}

// 下書き状態から本投稿 publishAplineBase 
export async function updateDraftAplineBase(userId: string, id: number) {
  //
  const db = await getDB();
  const apid = await generateNewApid();
  try {
    await db
      .update(aplineBase)
      .set({ apid: apid })
      .where(dz.eq(aplineBase.id, id));
  } catch (e) {
    console.error(e);
  }
  await db
    .delete(atbl.aplineDrafts)
    .where(dz.eq(atbl.aplineDrafts.articleId, id));

  await insertUserUnreadArticles(userId, id, 'created')
}

// 未読レコードを追加
export async function insertUserUnreadArticles(
  userId: string,
  articleId: number,
  reason: 'created' | 'updated'
) {

  const db = await getDB();

  // 自分以外の有効なユーザーを選択
  const otherUsers = await getOtherUsers(userId);
  await db.insert(atbl.userUnreadArticles).values(
    otherUsers.map((u) => ({
      userId: u.id,
      articleId,
      reason,
    }))
  ).onConflictDoNothing();
}

// 未読件数、未完了件数を取得
export async function getBadgeCounts(id: string) {
  //
  // const session = await auth();
  // if (!session?.user?.id) {
  //   throw new Error("Not authenticated");
  // }
  const db = await getDB();

  const unreadCount = await db.select({ count: dz.sql<number>`count(*)` })
    .from(atbl.userUnreadArticles)
    .where(dz.eq(atbl.userUnreadArticles.userId, id))
    .then((r) => r[0]?.count ?? 0);

  const incompleteCount = await db.select({ count: dz.sql<number>`count(*)` })
    .from(aplineBase)
    .where(
      dz.and(
        dz.notInArray(aplineBase.statusId, [5, 6]), // 下書きは含まない様に修正
        dz.ne(aplineBase.apid, "")
      )
    )
    .then((r) => r[0]?.count ?? 0);

  return {
    unreadCount,
    incompleteCount,
  };
}

export type ArticleLockResponce = {
  lock: {
    id: number;
    expiresAt: Date;
    createdAt: string;
    updatedAt: string;
    articleId: number;
    lockedBy: string;
    lockedAt: Date;
    releasedAt: Date | null;
    lockToken: string | null;
  };
  acquired: boolean;
};

export async function getAplineArticleLock(
  userId: string,
  articleId: number
): Promise<ArticleLockResponce> {
  const db = await getDB();
  const now = getNow();

  const existing = await db
    .select()
    .from(atbl.aplineArticleLocks)
    .where(dz.eq(atbl.aplineArticleLocks.articleId, articleId))
    .limit(1);

  const lock = existing[0];

  // ロックなし → INSERT
  if (!lock) {
    const inserted = await db
      .insert(atbl.aplineArticleLocks)
      .values({
        articleId,
        lockedBy: userId,
        lockedAt: new Date(),
        expiresAt: getExpiresAt(10),
      })
      .returning();

    return { lock: inserted[0], acquired: true };
  }

  // ロック有効かチェック
  const isActive = !lock.releasedAt && new Date(lock.expiresAt) > now;

  // 他人がロック中 → 取得不可
  if (isActive && lock.lockedBy !== userId) {
    return { lock, acquired: false };
  }

  // 自分 or 期限切れ → UPDATEで取り直し
  const updated = await db
    .update(atbl.aplineArticleLocks)
    .set({
      lockedBy: userId,
      lockedAt: new Date(),
      expiresAt: getExpiresAt(10),
      releasedAt: null,
    })
    .where(dz.eq(atbl.aplineArticleLocks.articleId, articleId))
    .returning();

  return { lock: updated[0], acquired: true };
}

// 編集ロックを強制的に解除
export async function forceUnlockAplineLockAction(articleId: number) {
  //
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  const db = await getDB();
  await db
    .update(atbl.aplineArticleLocks)
    .set({
      lockedBy: session.user.id,
      lockedAt: new Date(),
      expiresAt: getExpiresAt(10),
      releasedAt: new Date(),
      lockToken: 'force unlock'
    })
    .where(dz.eq(atbl.aplineArticleLocks.articleId, articleId))
    .returning();

  redirect(`/apline/edit/${articleId}`);
}

// お気に入り登録・解除
export async function toggleAplineFavorite(userId: string, articleId: number) {

  const db = await getDB();

  const existing = await db
    .select()
    .from(atbl.aplineFavorites)
    .where(
      dz.and(
        dz.eq(atbl.aplineFavorites.articleId, articleId),
        dz.eq(atbl.aplineFavorites.userId, userId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .delete(atbl.aplineFavorites)
      .where(
        dz.and(
          dz.eq(atbl.aplineFavorites.articleId, articleId),
          dz.eq(atbl.aplineFavorites.userId, userId)
        )
      );
    return false; // 解除
  } else {
    await db.insert(atbl.aplineFavorites).values({
      articleId,
      userId: userId,
    });
    return true; // 登録
  }
}