// app/api/user/search/route.ts

import { requireAuth } from "@/lib/utils/auth";
import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail } from "@/src/service/user.service";

// 認証なしでemailがユーザー登録されているか返す
export async function GET(
  request: NextRequest,
) {

  const { searchParams } = request.nextUrl;

  const requestEmail = searchParams.get("email");
  if (!requestEmail) {
    return NextResponse.json(
      { success: false, message: "emailが指定されていません" },
      { status: 404 }
    );
  }

  try {
    const res = await findUserByEmail(requestEmail);

    if (!res) {
      return NextResponse.json(
        { success: true, data: { isExits: false } }
      );
    }
    return NextResponse.json({
      success: true,
      data: { isExits: true }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "エラーが発生しました" },
      { status: 404 }
    );
  }
}