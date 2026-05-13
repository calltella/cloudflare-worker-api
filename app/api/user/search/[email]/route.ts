
import { getAplineDraftsExists } from "@/src/service/aplineSub.service";
import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail } from "@/src/service/user.service"

// 認証なしでemailがユーザー登録されているか返す
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const { email } = await params;
    const res = await findUserByEmail(email);

    return NextResponse.json({
      success: true,
      userId: res.id
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "ユーザーが見つかりません" },
      { status: 404 }
    );
  }
}
/**
 * findUserByEmail: {"success":true,
 * "res":
 *      {
 *       "id":"ac20cc34-1d60-4aeb-8755-2097c9311302",
 *       "email":"yuichi.asa@gmail.com",
 *       "name":"阿佐雄一",
 *       "avatarUrl":"1caef824-14bc-4488-9a4e-3a5eccd07d07-yuichi_cya.png",
 *       "passwordHash":"$2b$10$Wqmu1QFRELZAMWh8/Fq57ONHNrpa/J.rqmtdxQ605x/4ebdJLElUq",
 *       "emailVerified":"2026-05-01 07:45:34",
 *       "isActive":true,
 *       "role":"admin",
 *       "createdAt":"2026-05-01 07:45:34",
 *       "updatedAt":"2026-05-01 07:45:34",
 *       "deletedAt":null
 *      }
 *  }
 */