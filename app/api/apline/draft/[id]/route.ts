import { NextResponse } from "next/server";

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