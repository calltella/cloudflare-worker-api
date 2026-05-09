

import { getUserSettings } from "@/src/service/settings.service";
import { requireAuth } from "@/lib/utils/auth";

export async function GET(request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // notes全件取得
  const res = await getUserSettings(id);
  return Response.json(res)
}