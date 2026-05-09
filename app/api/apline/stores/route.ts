// app/api/apline/draft/route.ts
import { getAplineTenpoLists } from "@/src/service/aplineSub.service";
import { requireAuth } from "@/lib/utils/auth";

// 1件取得 GET    /notes/:id
// 更新 PUT    /notes/:id

// 一覧取得 GET /notes
export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  console.log(`auth: ${JSON.stringify(auth)}`);
  // 
  const res = await getAplineTenpoLists();
  console.log(`res: ${JSON.stringify(res)}`);
  return Response.json(res)
}