


import { requireAuth } from "@/lib/utils/auth";



/**
 * email にユーザーがぞんざいするか
 * @param req 
 * @returns 
 */
export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  console.log(`req: ${JSON.stringify(req)}`)

  return Response.json(auth)
}