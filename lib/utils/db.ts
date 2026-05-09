import { DrizzleD1Database, drizzle as drizzleD1 } from "drizzle-orm/d1";
import { drizzle as drizzleProxy } from "drizzle-orm/sqlite-proxy";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { CloudflareBindings } from "@/types/env";
import * as schema from "@/db/schema";

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const DATABASE_ID = process.env.CLOUDFLARE_DATABASE_ID!;
const TOKEN = process.env.CLOUDFLARE_D1_TOKEN!;

type D1Response = {
  result: {
    results: any[]
  }[]
}
/**
 * 開発でも本番でもリモートD1使おうとしたが断念（遅い）
 * テスト用にnotesだけ使う
 * @returns 
 */
export async function getDrizzleProxy() {
  // --- 開発環境 (Node → HTTP → D1 API) ---
  type DB = DrizzleD1Database<typeof schema>;
  return drizzleProxy(
    async (sql, params, method) => {
      const res = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sql, params }),
        }
      );

      const json = (await res.json()) as D1Response;
      const rows = json.result?.[0]?.results ?? [];

      const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

      const values = rows.map((row) =>
        columns.map((c) => row[c])
      );

      if (method === "all") {
        return { rows: values, columns };
      }

      if (method === "get") {
        return { rows: values[0] ?? null, columns };
      }

      if (method === "values") {
        return { rows: values };
      }

      return { rows: values, columns };
    },
    { schema }
  ) as unknown as DB;
}

export async function getDB() {
  // --- 本番 (Cloudflare Worker → D1 binding) ---
  const { env } = await getCloudflareContext<CloudflareBindings>({ async: true });

  const bindings = env as unknown as CloudflareBindings;

  if (!bindings.DB) {
    throw new Error("D1 binding not found");
  }

  return drizzleD1(bindings.DB, { schema });
}
