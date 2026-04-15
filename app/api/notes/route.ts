
import { verifyAccessToken } from "@/lib/jwt"
import { notes } from "@/db/schema/notes";
import { getDatabase } from "@/lib/utils/db";
import * as dz from "drizzle-orm";
export async function GET(req: Request) {
  //

  const authHeader = req.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 })
  }

  const token = authHeader.split(" ")[1]
  const payload = await verifyAccessToken(token)
  if (!payload) {
    return new Response("Invalid token", { status: 401 })
  }
  const db = await getDatabase();
  const res = db.select().from(notes).orderBy(dz.desc(notes.id));


  return Response.json(res)
}
