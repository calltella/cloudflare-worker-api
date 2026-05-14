
// app/api/notes/[id]/route.ts
import { deleteNote } from "@/src/service/notes.service";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  console.log(`notes delete id: ${id}`);

  const result = await deleteNote(Number(id));

  if (!result) {
    return new NextResponse("Note not found", { status: 404 });
  }

  return NextResponse.json({ success: true, deleted: result });
}
