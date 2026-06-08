// app/api/import/apline/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/jwt";
import { getReindexAplineBase } from "@/src/service/aplineImportDatas.service";

export const runtime = "nodejs";

const BATCH_SIZE = 300; // 一度に処理するIDの数（調整可）
const CONCURRENCY = 5; // 同時実行数（調整可）

export async function POST(req: NextRequest) {
  try {
    // =========================
    // 認証
    // =========================
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const user = await verifyAccessToken(token);

    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    //console.log(`Reindex 認証OK`);

    // =========================
    // body取得
    // =========================
    const body = await req.json();
    const startId = Number(body?.data?.reindexId);

    if (!startId) {
      return NextResponse.json({ error: "reindexId is required" }, { status: 400 });
    }

    console.log(`Start reindexId: ${startId}`);

    const results: any[] = [];

    // =========================
    // 並列制御付き処理
    // =========================
    for (let i = 0; i < BATCH_SIZE; i += CONCURRENCY) {
      const tasks: Promise<any>[] = [];

      for (let j = 0; j < CONCURRENCY && i + j < BATCH_SIZE; j++) {
        const currentId = startId + i + j;

        tasks.push(
          getReindexAplineBase(currentId)
            .then((res) => {
              //console.log(`✅ success: ${currentId}`);
              return { id: currentId, success: true, data: res };
            })
            .catch((err) => {
              console.error(`❌ error: ${currentId}`, err.message);
              return { id: currentId, success: false, error: err.message };
            })
        );
      }

      const batchResults = await Promise.all(tasks);
      results.push(...batchResults);
    }

    // =========================
    // response
    // =========================
    return NextResponse.json({
      status: 200,
      count: results.length,
      results,
    });

  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      { error: "Internal Server Error", detail: error.message },
      { status: 500 }
    );
  }
}