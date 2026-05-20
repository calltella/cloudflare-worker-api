// app/api/apline/create/route.ts

import { getAplineSelectItems, generateNewApid } from "@/src/service/apline.service";
import { requireAuth } from "@/lib/utils/auth";
import { NextRequest, NextResponse } from "next/server";
import { AplineSelectItems } from "@/types/article";
import type { CreateAplineInput } from "@/types/article";
import { createAplineBase } from "@/src/service/aplineUpdate.service";

export type submitTypeEnum = "draft" | "publish";

type CreateAplineRequestBody = CreateAplineInput & { submitType: submitTypeEnum };

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const requestJson: CreateAplineRequestBody = await request.json();

  let newId: number;

  if (requestJson.submitType === "draft") {
    newId = await createAplineBase(
      { ...requestJson, apid: "", tempKey: "" },
      auth.user.sub
    );
  } else if (requestJson.submitType === "publish") {
    const apid = await generateNewApid();
    newId = await createAplineBase(
      { ...requestJson, apid, tempKey: "" },
      auth.user.sub
    );
  } else {
    return NextResponse.json({ success: false, message: "submitTypeが不正です" }, { status: 400 });
  }
  console.log(`post new id: ${newId}`);
  return NextResponse.json({ success: true, data: newId });
}

// 編集用のセレクトボックスデータ取得
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const res: AplineSelectItems = await getAplineSelectItems();
  //console.log(`res: ${JSON.stringify(res)}`);
  return NextResponse.json(res)
}