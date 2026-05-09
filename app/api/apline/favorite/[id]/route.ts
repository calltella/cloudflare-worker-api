// app/api/apline/favorite/[id]/route.ts

import { toggleAplineFavorite } from "@/src/service/apline.service";
import { requireAuth } from "@/lib/utils/auth";

export async function GET(request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  // 
  const res = await toggleAplineFavorite(auth.user.sub, Number(id));
  return Response.json(res)
}