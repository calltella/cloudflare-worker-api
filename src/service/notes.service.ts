// /app/src/service/notes.service.ts

import { getDB } from "@/lib/utils/db";
import * as dz from "drizzle-orm";
import { notes } from "@/db/schema/notes";

// note全件取得
export async function getAllNotes() {
  const database = await getDB();
  const result = await database
    .select()
    .from(notes)
    .orderBy(dz.desc(notes.id));

  return result;
}

// notes データ登録
export async function createNote(data: {
  title: string
  content?: string
}) {
  const db = await getDB()

  const result = await db.insert(notes).values(data).returning()

  return result[0] // ← 純粋なデータだけ返す
}

// notes データ削除
export async function deleteNote(id: number) {
  const db = await getDB()
  const result = await db.delete(notes).where(dz.eq(notes.id, id)).returning()
  return result[0]
}