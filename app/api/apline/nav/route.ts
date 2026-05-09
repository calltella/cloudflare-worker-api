// app/api/apline/nav/[id]/route.ts
import { getBadgeCounts } from "@/src/service/apline.service";
import { requireAuth } from "@/lib/utils/auth";

export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  console.log(`auth response: ${JSON.stringify(auth)}`);
  // auth response: {"ok":true,
  // "user":{"sub":"326754cb","role":"admin","iat":1778286305,"exp":1778287205}}

  // ユーザー毎の未読・未完了取得
  const res = await getBadgeCounts(auth.user.sub);
  return Response.json(res)
}
