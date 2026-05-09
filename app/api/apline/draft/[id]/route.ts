import { NextResponse } from "next/server";
import { getAplineDraftsExists } from "@/src/service/aplineSub.service";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  console.log(`draft delete id: ${id}`);

  return NextResponse.json({
    success: true,
    id,
  });
}

export async function GET(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  console.log(`draft get id: ${id}`);

  const res = await getAplineDraftsExists(Number(id))

  return NextResponse.json({
    success: true,
    res
  });
}