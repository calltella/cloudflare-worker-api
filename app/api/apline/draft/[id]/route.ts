import { getAplineDraftsExists } from "@/src/service/aplineSub.service";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/utils/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  //console.log(`draft delete id: ${id}`);

  return NextResponse.json({
    success: true,
    id,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
  //console.log(`draft get id: ${id}`);

  const res = await getAplineDraftsExists(auth.user.sub, Number(id))
  console.log(`getAplineDraftsExists: ${JSON.stringify(res)}`);

  return NextResponse.json({
    success: true,
    res
  });
}