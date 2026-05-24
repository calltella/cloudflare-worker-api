import { NextRequest, NextResponse } from "next/server";
import { fetchAllAplineForExport } from "@/src/service/apline.service";

import type { GetAplineListViewsParams } from "@/src/service/apline.service";

import { requireAuth } from "@/lib/utils/auth";
import { fetchAplineList } from "@/src/service/apline.service";
import type { AplineListDTO } from "@/src/features/apline/types/ui";
import { toDateString } from "@/lib/utils/date";

/**
 * CSVエクスポート
 * Excelでの文字化けを防ぐため UTF-8 with BOM で出力
 * 必要なparams（期間開始、終了）
 * fromDate,toDate
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const { searchParams } = request.nextUrl;

  const fromDateRaw = searchParams.get("fromDate");
  const toDateRaw = searchParams.get("toDate");

  // 必須パラメータのバリデーション
  if (!fromDateRaw || !toDateRaw) {
    return NextResponse.json(
      { success: false, message: "fromDateRaw と toDateRaw は必須です" },
      { status: 400 }
    );
  }

  if (!toDateString(fromDateRaw) || !toDateString(toDateRaw)) {
    return NextResponse.json(
      { success: false, message: "日付形式が不正です" },
      { status: 400 }
    );
  }

  try {
    const data = await fetchAllAplineForExport({ fromDate: fromDateRaw, toDate: toDateRaw });

    // ヘッダー定義
    const headers = [
      "ID", "管理番号", "タイトル", "ステータス", "組織", "担当者",
      "業務内容", "調査結果", "対応回答", "受付日", "作業開始",
      "作業終了", "発生日", "顧客影響", "対応備考", "メール送信",
      "受付者", "起票者", "最終更新者", "依頼区分", "分類",
      "サブシステム", "業務区分", "緊急度", "影響度", "優先度",
      "原因", "処置", "重症度", "登録日時", "更新日時"
    ];

    // データの文字列化（カンマ、改行のエスケープ処理含む）
    const escapeCsv = (str: string | number | null | undefined) => {
      if (str === null || str === undefined) return "";
      const s = String(str);
      // カンマ、ダブルクォート、改行が含まれる場合はダブルクォートで囲み、
      // 内側のダブルクォートは2つ重ねる
      if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const rows = data.map((item) => [
      item.id,
      item.apid,
      item.title,
      item.status,
      item.organization,
      item.responsible,
      item.workContent,
      item.surveyResults,
      item.dealAnswer,
      item.reception,
      item.workStartTime,
      item.workEndTime,
      item.occurrenceDate,
      item.customerImpact,
      item.correspondingNote,
      item.mailFlag,
      item.acceptanceUserName,
      item.slipIssuanceUserName,
      item.itemUpdaterUserName,
      item.requestCategory,
      item.classification,
      item.subsystem,
      item.business,
      item.emergency,
      item.impact,
      item.priority,
      item.cause,
      item.deal,
      item.severity,
      item.createdAt,
      item.updatedAt,
    ].map(escapeCsv).join(","));

    const csvContent = [headers.join(","), ...rows].join("\n");

    // UTF-8 BOM
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const content = new TextEncoder().encode(csvContent);
    const combined = new Uint8Array(bom.length + content.length);
    combined.set(bom);
    combined.set(content, bom.length);

    return new NextResponse(combined, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="apline_export.csv"',
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
