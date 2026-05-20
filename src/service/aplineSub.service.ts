import { auth } from "@/lib/auth.config";
import { getDB } from "@/lib/utils/db";
import { eq, desc, and, aliasedTable, sql, isNotNull, isNull, inArray } from "drizzle-orm";
import * as aplineSubtables from "@/db/schema/aplineSubTables";
import { APLINE_PULLDOWN_SELECT } from "@/db/selects/apline.select";
import { aplineBase } from "@/db/schema/aplineBase";
import * as aplineSchema from "@/db/schema/aplineMasters";
import { users, account } from "@/db/schema";
import type { UploadFileMeta } from "@/src/features/apline/types/ui";
import { aplinePulldownList, userUnreadArticles, aplineFileStore, aplineDrafts, aplineFavorites } from "@/db/schema/aplineSubTables";
import { formatToDbDateTime, getJstDateTimeString } from "@/lib/utils/date";
import { getDownloadUrlFromR2, getDownloadUrlFromWorkerR2 } from "@/src/service/storage.service";

// 店舗一覧を取得
export async function getAplineTenpoLists() {
  const db = await getDB();

  const results = await db
    .select(APLINE_PULLDOWN_SELECT)
    .from(aplineSubtables.aplinePulldownList)
    .where(
      and(
        eq(aplineSubtables.aplinePulldownList.groupNo, 1000),
        eq(aplineSubtables.aplinePulldownList.registOrder, 1)
      )
    )
    .orderBy(aplineSubtables.aplinePulldownList.orderNo);
  return results;
}

// 下書き一覧の表示
export async function getDraftAplineList(userId: string) {

  const db = await getDB();

  const resultsRaw = await db
    .select({
      id: aplineBase.id,
      title: aplineBase.title,
      apid: aplineBase.apid,
      organization: aplineBase.organization,
      responsible: aplineBase.responsible,
      workContent: aplineBase.workContent,

      statusId: aplineBase.statusId,
      status: aplineSchema.aplineStatus.status,

      acceptanceUserId: aplineBase.acceptanceId,
      acceptanceUserName: users.name,
      acceptanceAplineUserId: account.aplineUserId,

      mailFlag: aplineBase.mailFlag,
      occurrenceDate: aplineBase.occurrenceDate,
      updatedAt: aplineBase.updatedAt,
    })
    .from(aplineBase)

    .leftJoin(
      aplineSchema.aplineStatus,
      eq(aplineBase.statusId, aplineSchema.aplineStatus.id)
    )

    .leftJoin(
      account,
      eq(account.aplineUserId, aplineBase.acceptanceId)
    )

    .leftJoin(
      users,
      eq(users.id, account.userId)
    )

    .leftJoin(
      aplineDrafts,
      eq(aplineDrafts.articleId, aplineBase.id)
    )
    .where(and(isNotNull(aplineDrafts.id), eq(users.id, userId)))
    .orderBy(desc(aplineBase.id));
  return resultsRaw
}

// お気に入り一覧の表示
export async function getFavoriteAplineList(userId?: string) {
  if (!userId) return [];
  const db = await getDB();

  const resultsRaw = await db
    .select({
      id: aplineBase.id,
      title: aplineBase.title,
      apid: aplineBase.apid,
      organization: aplineBase.organization,
      responsible: aplineBase.responsible,
      workContent: aplineBase.workContent,

      statusId: aplineBase.statusId,
      status: aplineSchema.aplineStatus.status,

      acceptanceUserId: aplineBase.acceptanceId,
      acceptanceUserName: users.name,
      acceptanceAplineUserId: account.aplineUserId,

      mailFlag: aplineBase.mailFlag,
      occurrenceDate: aplineBase.occurrenceDate,
      updatedAt: aplineBase.updatedAt,
    })
    .from(aplineBase)

    .leftJoin(
      aplineSchema.aplineStatus,
      eq(aplineBase.statusId, aplineSchema.aplineStatus.id)
    )

    .leftJoin(
      account,
      eq(account.aplineUserId, aplineBase.acceptanceId)
    )

    .leftJoin(
      users,
      eq(users.id, account.userId)
    )

    .innerJoin(
      aplineFavorites,
      and(
        eq(aplineFavorites.articleId, aplineBase.id),
        eq(aplineFavorites.userId, userId)
      )
    )
    .orderBy(desc(aplineBase.id));
  return resultsRaw
}

// 添付ファイルの保存
export async function saveFileMetadata(
  joinId: number | null,
  tempKey: string,
  files: UploadFileMeta[],
  fileNames: string[],
) {
  const db = await getDB();

  const records = files.map((file, index) => ({
    folder: file.path.split("/").slice(0, -1).join("/"),
    ext: file.ext,
    size: file.size,
    joinId,
    tempKey,
    md5Hash: file.md5Hash.replace(/"/g, ""),
    downloadKey: crypto.randomUUID(),
    filePath: file.path,
    fileName: fileNames[index] ?? null,
  }));

  await db.insert(aplineFileStore).values(records);
}

//　ログインユーザーの下書きリストを取得 20260520
export async function getAplineDraftsExists(userId: string, articleId: number) {

  const session = await auth();
  const db = await getDB();
  console.log(`${session?.user.id}`)

  return await db
    .select()
    .from(aplineDrafts)
    .where(
      and(
        eq(aplineDrafts.userId, userId),
        eq(aplineDrafts.articleId, articleId)
      )
    );
}

// 下書き状態の更新
export async function updateAplineDrafts(articleId: number) {
  //
  const session = await auth();
  const db = await getDB();

  await db
    .update(aplineDrafts)
    .set({
      articleId,
      updatedAt: getJstDateTimeString(),
    })
    .where(
      and(
        eq(aplineDrafts.userId, session?.user.id),
        eq(aplineDrafts.articleId, articleId)
      )
    );

}

// 下書きリスト追加
export async function insertAplineDrafts(userId: string, articleId: number) {

  const db = await getDB();

  await db.insert(aplineDrafts).values({
    userId: userId,
    articleId,
    createdAt: getJstDateTimeString(),
    updatedAt: getJstDateTimeString(),
  });

}

// お気に入りの切り替え
export async function toggleFavorite(articleId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const db = await getDB();

  const existing = await db
    .select()
    .from(aplineFavorites)
    .where(
      and(
        eq(aplineFavorites.userId, session.user.id),
        eq(aplineFavorites.articleId, articleId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // 削除
    await db
      .delete(aplineFavorites)
      .where(
        and(
          eq(aplineFavorites.userId, session.user.id),
          eq(aplineFavorites.articleId, articleId)
        )
      );
    return false;
  } else {
    // 追加
    await db.insert(aplineFavorites).values({
      userId: session.user.id,
      articleId,
      createdAt: getJstDateTimeString(),
      updatedAt: getJstDateTimeString(),
    });
    return true;
  }
}

// お気に入りの一括解除
export async function removeFavorites(articleIds: number[]) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const db = await getDB();

  await db
    .delete(aplineFavorites)
    .where(
      and(
        eq(aplineFavorites.userId, session.user.id),
        inArray(aplineFavorites.articleId, articleIds)
      )
    );
}

// 添付ファイルのダウンロードURLを取得(開発用)
export async function getAplineFileDownloadUrl(downloadKey: string) {
  const db = await getDB();

  const fileRecord = await db
    .select()
    .from(aplineFileStore)
    .where(eq(aplineFileStore.downloadKey, downloadKey))
    .limit(1);

  if (fileRecord.length === 0) {
    throw new Error("File not found");
  }

  const filePath = fileRecord[0].filePath;
  const fileName = fileRecord[0].fileName || "download";

  if (!filePath) {
    throw new Error("File path not found");
  }

  console.log(`filePath: ${filePath}`)

  const downloadUrl = process.env.CLOUDFLARE_ENV
    ? await getDownloadUrlFromWorkerR2(filePath, fileName) // Workers環境なら直接URLを取得
    : await getDownloadUrlFromR2(filePath, fileName); // ローカル環境でも同じ関数でURLを取得

  return downloadUrl;
}

