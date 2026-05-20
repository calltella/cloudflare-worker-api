"use server";

/**
 * 更新したデータの変化量に応じて未読フラグの判定をする
 * 
 */
import { auth } from "@/lib/auth.config";
import { getDB } from "@/lib/utils/db";
import * as dz from "drizzle-orm";
import { aplineBase } from "@/db/schema/aplineBase";
import type { CommonFields, AplineBaseRow } from "@/db/schema/aplineBase";
import { aplineFileStore } from "@/db/schema/aplineSubTables";
import { UpdateAplineInput, CreateAplineInput } from "@/lib/utils/validation/apline.schema";
import { formatToDbDateTime, getJstDateTimeString } from "@/lib/utils/date";
import { getUserWithAccount } from "@/src/service/user.service";
import { insertUserUnreadArticles } from "@/src/service/apline.service";
import { insertAplineDrafts } from "@/src/service/aplineSub.service";

// ── 型定義 ──────────────────────────────────────────────
type WatchedTextField = keyof Pick<CommonFields,
  | "title"
  | "organization"
  | "responsible"
  | "workContent"
  | "surveyResults"
  | "dealAnswer"
  | "customerImpact"
  | "correspondingNote"
>;

type FieldChangeResult = {
  field: WatchedTextField;
  before: string | null;
  after: string | null;
  diff: number;
};

type ChangeDetectionResult = {
  shouldUpdate: boolean;       // falseならupdate処理ごとスキップ
  flaggedFields: FieldChangeResult[];  // 閾値超えたフィールド一覧
};

// フィールドごとの閾値設定(変更文字数が閾値以上なら更新フラグを立てる)
const TEXT_FIELD_THRESHOLDS: Record<WatchedTextField, number> = {
  title: 5,   // タイトル
  organization: 5,  // 顧客組織名
  responsible: 5,  // 顧客担当者
  workContent: 5,  // 受付内容
  surveyResults: 5,  // 調査結果
  dealAnswer: 5,   // 対処
  customerImpact: 10,  // 顧客影響
  correspondingNote: 10,  // 対応メモ
};

const COMMON_FIELD_KEYS = [
  "title", "organization", "responsible", "workContent",
  "surveyResults", "dealAnswer", "customerImpact", "correspondingNote",
  "statusId", "causeId", "classificationId", "dealId",
  "emergencyId", "impactId", "priorityId", "requestCategoryId",
  "severityId", "subsystemId", "businessId", "itemUpdaterId",
  "occurrenceDate", "reception", "workStartTime", "workEndTime",
  "mailFlag",
] as const satisfies (keyof CommonFields)[];

function pickCommonFields(row: AplineBaseRow): CommonFields {
  return Object.fromEntries(
    COMMON_FIELD_KEYS.map((key) => [key, row[key]])
  ) as CommonFields;
}

/** null/undefined を空文字として正規化 */
function normalize(v: string | null | undefined): string {
  return v?.trim() ?? "";
}

/** 全フィールドが同値かどうか（update自体をスキップする判定） */
function isCommonFieldsUnchanged(
  before: CommonFields,
  after: CommonFields
): boolean {
  return (Object.keys(after) as (keyof CommonFields)[]).every(
    (key) => before[key] === after[key]
  );
}

/** テキスト系フィールドの変化量チェック */
function detectTextFieldChanges(
  before: CommonFields,
  after: CommonFields
): FieldChangeResult[] {
  return (Object.entries(TEXT_FIELD_THRESHOLDS) as [WatchedTextField, number][])
    .flatMap(([field, threshold]) => {
      const b = normalize(before[field]);  // WatchedTextField は CommonFields のキーなので型安全
      const a = normalize(after[field]);
      const diff = Math.abs(b.length - a.length);
      if (diff >= threshold) {
        return [{ field, before: b, after: a, diff }];
      }
      return [];
    });
}

// ── メイン検知関数 ────────────────────────────────────────
async function detectCommonFieldChanges(
  currentId: number,
  newFields: CommonFields
): Promise<ChangeDetectionResult> {
  const db = await getDB();
  const current = await db
    .select()
    .from(aplineBase)
    .where(dz.eq(aplineBase.id, currentId));

  if (current.length === 0) {
    return { shouldUpdate: false, flaggedFields: [] };
  }

  // CommonFields のキーだけに絞る
  const currentFields = pickCommonFields(current[0]);
  // 全フィールド不変チェック → updateスキップ判定
  if (isCommonFieldsUnchanged(currentFields, newFields)) {
    //console.log(`変化がないので更新スキップ`)
    return { shouldUpdate: false, flaggedFields: [] };
  }

  // テキスト系のみ閾値チェック → フラグ対象抽出
  const flaggedFields = detectTextFieldChanges(currentFields, newFields);
  //console.log(`テキスト系のみ閾値チェック flaggedFields: ${JSON.stringify(flaggedFields)}`);
  return { shouldUpdate: true, flaggedFields };
}

/**
 * 新規投稿
 * @param params 
 * @param userId 
 * @returns 
 */
export async function createAplineBase(
  params: CreateAplineInput & { apid: string; tempKey: string }, userId: string
): Promise<number> {

  const db = await getDB();
  const authUser = await getUserWithAccount(userId);

  const commonFields: CommonFields = {
    title: params.title ?? null,
    organization: params.organization ?? null,
    responsible: params.responsible ?? null,
    workContent: params.workContent ?? null,
    surveyResults: params.surveyResults ?? null,
    dealAnswer: params.dealAnswer ?? null,
    customerImpact: params.customerImpact ?? null,
    correspondingNote: params.correspondingNote ?? null,
    statusId: params.statusId ?? null,
    causeId: params.causeId ?? null,
    classificationId: params.classificationId ?? null,
    dealId: params.dealId ?? null,
    emergencyId: params.emergencyId ?? null,
    impactId: params.impactId ?? null,
    priorityId: params.priorityId ?? null,
    requestCategoryId: params.requestCategoryId ?? null,
    severityId: params.severityId ?? null,
    subsystemId: params.subsystemId ?? null,
    businessId: params.businessId ?? null,
    occurrenceDate: params.occurrenceDate ? formatToDbDateTime(params.occurrenceDate) : null,
    reception: params.reception ? formatToDbDateTime(params.reception) : null,
    workStartTime: params.workStartTime ? formatToDbDateTime(params.workStartTime) : null,
    workEndTime: params.workEndTime ? formatToDbDateTime(params.workEndTime) : null,
    itemUpdaterId: authUser.aplineUserId,
    mailFlag: params.mailFlag ?? false,
  };

  const inserted = await db.insert(aplineBase).values({
    ...commonFields,
    apid: params.apid?.trim() ? params.apid : null,
    acceptanceId: authUser.aplineUserId,
    slipIssuanceId: authUser.aplineUserId,
    createdAt: getJstDateTimeString(),
    updatedAt: getJstDateTimeString(),
  });
  const newId = inserted.meta.last_row_id;

  await db
    .update(aplineFileStore)
    .set({ joinId: newId, tempKey: null })
    .where(dz.eq(aplineFileStore.tempKey, params.tempKey));


  await insertAplineDrafts(userId, newId)

  return newId;

}

export async function updateAplineBase(params: UpdateAplineInput): Promise<number>;
export async function updateAplineBase(params: CreateAplineInput & { apid: string, tempKey: string }): Promise<number>;
export async function updateAplineBase(
  params: UpdateAplineInput | (CreateAplineInput & { apid: string; tempKey: string })
): Promise<number> {
  const db = await getDB();
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const authUser = await getUserWithAccount(session.user.id);

  const commonFields: CommonFields = {
    title: params.title ?? null,
    organization: params.organization ?? null,
    responsible: params.responsible ?? null,
    workContent: params.workContent ?? null,
    surveyResults: params.surveyResults ?? null,
    dealAnswer: params.dealAnswer ?? null,
    customerImpact: params.customerImpact ?? null,
    correspondingNote: params.correspondingNote ?? null,
    statusId: params.statusId ?? null,
    causeId: params.causeId ?? null,
    classificationId: params.classificationId ?? null,
    dealId: params.dealId ?? null,
    emergencyId: params.emergencyId ?? null,
    impactId: params.impactId ?? null,
    priorityId: params.priorityId ?? null,
    requestCategoryId: params.requestCategoryId ?? null,
    severityId: params.severityId ?? null,
    subsystemId: params.subsystemId ?? null,
    businessId: params.businessId ?? null,
    occurrenceDate: params.occurrenceDate ? formatToDbDateTime(params.occurrenceDate) : null,
    reception: params.reception ? formatToDbDateTime(params.reception) : null,
    workStartTime: params.workStartTime ? formatToDbDateTime(params.workStartTime) : null,
    workEndTime: params.workEndTime ? formatToDbDateTime(params.workEndTime) : null,
    itemUpdaterId: authUser.aplineUserId,
    mailFlag: params.mailFlag ?? false,
  };

  // 新規投稿判定
  if ("id" in params) {
    // 未読判定処理
    const { shouldUpdate, flaggedFields } = await detectCommonFieldChanges(
      params.id,
      commonFields
    );

    if (!shouldUpdate) {
      // 変化なし → DBアクセス不要
      return params.id;
    }

    // 更新処理
    await db
      .update(aplineBase)
      .set({ ...commonFields, updatedAt: getJstDateTimeString() })
      .where(dz.eq(aplineBase.id, params.id));

    // フラグが立っているフィールドがあれば未読フラグを立てる
    if (flaggedFields.length > 0) {
      await insertUserUnreadArticles(params.id, 'updated');
    }

    return params.id;
  } else {
    // ── INSERT（既存のまま） ──
    const inserted = await db.insert(aplineBase).values({
      ...commonFields,
      apid: params.apid?.trim() ? params.apid : null,
      acceptanceId: authUser.aplineUserId,
      slipIssuanceId: authUser.aplineUserId,
      createdAt: getJstDateTimeString(),
      updatedAt: getJstDateTimeString(),
    });
    const newId = inserted.meta.last_row_id;

    await db
      .update(aplineFileStore)
      .set({ joinId: newId, tempKey: null })
      .where(dz.eq(aplineFileStore.tempKey, params.tempKey));

    return newId;
  }
}

