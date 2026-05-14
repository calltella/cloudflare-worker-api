// app/api/notes/route.ts

import { getAllNotes, createNote } from "@/src/service/notes.service";
import { NextRequest, NextResponse } from "next/server";

// レート制限用のシンプルなストア
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const LIMIT = 3;           // 最大リクエスト数
const WINDOW_MS = 60_000;  // ウィンドウ幅（60秒）

function checkRateLimit(ip: string): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    // 初回 or ウィンドウ期限切れ → リセット
    rateLimitStore.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, retryAfter: 0 };
  }

  if (entry.count >= LIMIT) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count++;
  return { ok: true, retryAfter: 0 };
}

// 一覧取得 GET /notes
export async function GET(request: NextRequest) {

  // notes全件取得
  const result = await getAllNotes();
  return NextResponse.json(result)
}

// 作成 POST   /notes
export async function POST(request: NextRequest) {

  // Cloudflare は CF-Connecting-IP ヘッダーにクライアントIPが入る
  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";

  const { ok, retryAfter } = checkRateLimit(ip);
  if (!ok) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    });
  }

  const body = await request.json();

  const { title, content } = body;

  if (!title) {
    return new NextResponse("Title is required", { status: 400 });
  }

  const result = await createNote({ title, content });

  return NextResponse.json(result);
}
