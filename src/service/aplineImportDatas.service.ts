// /app/src/service/aplineImportDatas.service.ts

/**
 * aplineからデータインポートするサービス群
 * 完全にインポートが完了するまでさわらない
 * 
 * Ｒ２へのファイルアップロードはHttpで直接実施（API経由しない）
 * 
 */

import { getDB } from "@/lib/utils/db";
import { aplineBase } from "@/db/schema/aplineBase";
import { aplineFileStore } from "@/db/schema/aplineSubTables";

import { tokenize } from "@/lib/utils/tokenize";

import { eq, sql } from "drizzle-orm";
import { getJstDateTimeString, convertToJstFormat } from "@/lib/utils/date";
import { formDataToCamel } from "@/lib/utils/validation/formDataToCamel";

export async function insertAplineBaseData(params: any[]) {
  const db = await getDB();
  const results = [];

  for (const item of params) {
    try {
      if (!item.id) {
        results.push({ id: null, status: "error", message: "ID is required" });
        continue;
      }

      const mapped = formDataToCamel(item);
      //console.log(`mapped Data: ${JSON.stringify(mapped)}`);

      const existing = await db.query.aplineBase.findFirst({
        where: eq(aplineBase.id, item.id),
      });

      // params優先（無ければ現在時刻）
      // 👇 型を安全に整形
      const createdAt =
        typeof mapped.createdAt === "string"
          ? convertToJstFormat(mapped.createdAt) ?? getJstDateTimeString()
          : getJstDateTimeString();

      const updatedAt =
        typeof mapped.updatedAt === "string"
          ? convertToJstFormat(mapped.updatedAt) ?? getJstDateTimeString()
          : getJstDateTimeString();

      const { createdAt: _c, updatedAt: _u, ...safeMapped } = mapped;
      console.log(`safeMapped Data: ${JSON.stringify(mapped.id)}`);
      //console.log(`createdAt: ${JSON.stringify(createdAt)}`);

      if (existing) {
        // Update
        await db
          .update(aplineBase)
          .set({
            ...safeMapped,
            updatedAt: updatedAt,
          })
          .where(eq(aplineBase.id, item.id));

        results.push({ id: item.id, status: "updated" });
      } else {
        // Insert
        await db.insert(aplineBase).values({
          ...safeMapped,
          createdAt: createdAt,
          updatedAt: updatedAt,
        });

        results.push({ id: item.id, status: "inserted" });
      }
    } catch (error: any) {
      console.error(`Error processing item ${item.id}:`, error);
      results.push({ id: item.id, status: "error", message: error.message });
    }
  }

  return results;
}

type InsertAplineFileParams = {
  data: {
    folder?: number;
    file_path: string;
    file_name: string;
    size: number;
    join_id?: number;
    md5_hash: string;
    created_at: string;
    updated_at: string;
  };
};

export async function insertAplineFilesData({
  data,
}: InsertAplineFileParams) {
  const { folder, file_path, file_name, size, join_id, md5_hash, created_at, updated_at } = data;

  if (!file_path || !file_name || !size) {
    throw new Error("Missing required fields");
  }
  // 拡張子抽出（file_name優先）
  const ext = file_name.split(".").pop()?.toLowerCase() ?? "";

  const db = await getDB();
  const result = await db
    .insert(aplineFileStore)
    .values({
      folder: String(folder ?? ""),
      filePath: file_path,
      fileName: file_name,
      ext,
      size,
      joinId: join_id ?? null,
      downloadKey: crypto.randomUUID(),
      tempKey: null,
      md5Hash: md5_hash ?? null,
      createdAt: convertToJstFormat(created_at),
      updatedAt: convertToJstFormat(updated_at),
    })
    .returning();

  return result[0];
}

/**
 * aplineBase id を投げると検索用のインデックスを再作成します
 * 既存データ作成用にAPIからも呼ばれます
 * 記事編集したらその都度呼ばれます
 * @param reindexId 
 * @returns 
 */
export async function getReindexAplineBase(reindexId: number) {
  const db = await getDB();

  const results = await db
    .select({
      id: aplineBase.id,
      apid: aplineBase.apid,
      title: aplineBase.title,
      responsible: aplineBase.responsible, // 受付者
      organization: aplineBase.organization,
      workContent: aplineBase.workContent,
      surveyResults: aplineBase.surveyResults,
      dealAnswer: aplineBase.dealAnswer,
      customerImpact: aplineBase.customerImpact,
      correspondingNote: aplineBase.correspondingNote
    })
    .from(aplineBase)
    .where(eq(aplineBase.id, reindexId));

  const result = results[0];
  if (!result) return null;

  // ✅ tokenize
  let apidTokenizedBody = "";

  if (result.apid) {
    const numOnly = result.apid.replace(/\D/g, ""); // "000320"
    const numNoLeadingZero = numOnly.replace(/^0+/, ""); // "320"
    apidTokenizedBody = `${result.apid} ${numOnly} ${numNoLeadingZero}`;
  }

  const tokenizedTitle = tokenize(result.title ?? "");
  const tokenizedResponsible = tokenize(result.responsible ?? "");
  const organizationBody = tokenize(result.organization ?? "");
  const workContentBody = tokenize(result.workContent ?? "");
  const surveyResultsBody = tokenize(result.surveyResults ?? "");
  const dealAnswerBody = tokenize(result.dealAnswer ?? "");
  const customerImpactBody = tokenize(result.customerImpact ?? "");
  const correspondingNoteBody = tokenize(result.correspondingNote ?? "");

  // ✅ bodyまとめる（FTS検索しやすくする）
  const body = [
    apidTokenizedBody,
    tokenizedTitle,
    tokenizedResponsible,
    organizationBody,
    workContentBody,
    surveyResultsBody,
    dealAnswerBody,
    customerImpactBody,
    correspondingNoteBody
  ].join(" ");

  // ✅ 既存削除（重複防止）
  await db.run(sql`
    DELETE FROM fts_index WHERE rowid = ${result.id}
  `);

  // ✅ INSERT（FTS）
  await db.run(sql`
    INSERT INTO fts_index (rowid,  body)
    VALUES (${result.id}, ${body})
  `);

  return result;
}
