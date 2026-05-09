// app/lib/utils/kv.ts

import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { CloudflareBindings } from "@/types/env";
import type { KVNamespace } from "@cloudflare/workers-types";

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const KV_NAMESPACE_ID = "a9337b82025c494fba4f3e921c3f5e93"; // wrangler.jsonc から取得
const TOKEN = process.env.CLOUDFLARE_KV_TOKEN!; // D1と同じトークンを使用すると仮定

/**
 * 開発環境用のKVプロキシ
 */
function getKVProxy(): KVNamespace {
  const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces/${KV_NAMESPACE_ID}`;
  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
  };

  return {
    get: async (key: string, type?: any) => {
      const res = await fetch(`${baseUrl}/values/${key}`, { headers });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`KV API error: ${res.statusText}`);

      if (type === "json") return res.json();
      if (type === "text" || !type) return res.text();
      if (type === "arrayBuffer") return res.arrayBuffer();
      if (type === "stream") return res.body;
      return res.text();
    },
    put: async (key: string, value: string | ArrayBuffer | ArrayBufferView | ReadableStream, options?: any) => {
      const res = await fetch(`${baseUrl}/values/${key}`, {
        method: "PUT",
        headers,
        body: value as any,
      });
      if (!res.ok) throw new Error(`KV API error: ${res.statusText}`);
    },
    delete: async (key: string) => {
      const res = await fetch(`${baseUrl}/values/${key}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error(`KV API error: ${res.statusText}`);
    },
    list: async (options?: any) => {
      const url = new URL(`${baseUrl}/keys`);
      if (options?.prefix) url.searchParams.set("prefix", options.prefix);
      if (options?.limit) url.searchParams.set("limit", options.limit.toString());
      if (options?.cursor) url.searchParams.set("cursor", options.cursor);

      const res = await fetch(url.toString(), { headers });
      if (!res.ok) throw new Error(`KV API error: ${res.statusText}`);
      const json = await res.json();
      return json.result;
    },
    getWithMetadata: async function (this: any, key: string, type?: any) {
      // 簡易実装
      const value = await this.get(key, type);
      return { value, metadata: null };
    }
  } as unknown as KVNamespace;
}

export async function getKV(): Promise<KVNamespace> {
  // 本番環境のみ
  const context = await getCloudflareContext({ async: true });
  const env = context.env as unknown as CloudflareBindings;

  if (!env.VERCEL_KV) {
    throw new Error("VERCEL_KV binding not found");
  }

  return env.VERCEL_KV;
}

