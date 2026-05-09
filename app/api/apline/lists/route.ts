// app/api/apline/lists/route.ts

import { requireAuth } from "@/lib/utils/auth";
import { fetchAplineList } from "@/src/service/apline.service"

export async function POST(req: Request) {
  // token取得ユーザーと認証ユーザーは異なる
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  console.log(`認証ユーザー: ${auth.user.sub}`);
  const body = await req.json();
  console.log(`lists response: ${JSON.stringify(body)}`);

  const res = await fetchAplineList(body);

  //console.log(`lists response: ${JSON.stringify(res)}`);

  console.log(`lists count: ${res.aplineDatas.length}`); // 配列の場合

  //return { "ok": true };
  return Response.json(res)
}

