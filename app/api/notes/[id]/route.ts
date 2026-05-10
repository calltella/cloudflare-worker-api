
// app/api/notes/[id]/route.ts
import { deleteNote } from "@/src/service/notes.service";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  console.log(`notes delete id: ${id}`);

  const result = await deleteNote(Number(id));

  if (!result) {
    return new Response("Note not found", { status: 404 });
  }

  return Response.json({ success: true, deleted: result });
}
