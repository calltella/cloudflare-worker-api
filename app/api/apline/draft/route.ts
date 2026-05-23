// app/api/apline/draft/route.ts

import { getDraftAplineList } from "@/src/service/aplineSub.service";
import { requireAuth } from "@/lib/utils/auth";
import { NextRequest, NextResponse } from "next/server";
//import type { CreateAplineInput } from "@/types/article";
import { updateAplineArticle } from "@/src/service/aplineUpdate.service";
import { UpdateAplineInput, CreateAplineInput } from "@/lib/utils/validation/apline.schema";

// export type submitTypeEnum = "draft" | "publish";
// type CreateAplineRequestBody = CreateAplineInput & { submitType: submitTypeEnum };

/**
 * 下書き用(idあり、apidなし)
 * @param request 
 * @returns 
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const requestJson: UpdateAplineInput = await request.json();

  const updateId = await updateAplineArticle(requestJson, auth.user.sub);

  return NextResponse.json({ success: true, data: updateId });
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
  //console.log(`auth: ${JSON.stringify(auth)}`);
  // 
  const res = await getDraftAplineList(auth.user.sub);
  //console.log(`res: ${JSON.stringify(res)}`);
  return NextResponse.json(res)
}