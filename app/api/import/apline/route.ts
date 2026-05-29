// app/api/import/apline/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/jwt";
import { insertAplineBaseData } from "@/src/service/aplineImportDatas.service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // =========================
    // 認証
    // =========================
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const user = await verifyAccessToken(token);

    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    // console.log(`認証OK`)

    // =========================
    // body取得
    // =========================
    const body = await req.json();
    // console.log(`Body: ${JSON.stringify(body)}`)

    let items: any[] = [];

    if (Array.isArray(body?.data)) {
      items = body.data;
    } else if (Array.isArray(body)) {
      items = body;
    } else if (body && typeof body === "object") {
      items = [body];
    } else {
      return NextResponse.json(
        { error: "Invalid body format" },
        { status: 400 }
      );
    }

    if (items.length === 0 || items.length > 20) {
      return NextResponse.json(
        { error: "受取れる件数は1～20件です" },
        { status: 400 }
      );
    }

    // IDチェック
    for (const item of items) {
      if (!item.id) {
        return NextResponse.json(
          { error: "idは各アイテムで必須です" },
          { status: 400 }
        );
      }
    }

    // console.log("before insert");
    const results = await insertAplineBaseData(items);
    // console.log("after insert");

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      { error: "Internal Server Error", detail: error.message },
      { status: 500 }
    );
  }
}
