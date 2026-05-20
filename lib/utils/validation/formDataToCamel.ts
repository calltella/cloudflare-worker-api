// lib/utils/validation/formDataToCamel.ts

// フォームデータをcamelCaseのオブジェクトに変換するユーティリティ関数
export function formDataToCamel<T = Record<string, unknown>>(
  data: FormData | Record<string, unknown>
): T {

  const raw: Record<string, unknown> =
    data instanceof FormData
      ? Object.fromEntries(data.entries())
      : data;

  return {
    ...raw,
    id: raw.id !== undefined ? Number(raw.id) : undefined, // 明示的に追加
    statusId: raw.status_id,
    subsystemId: raw.subsystem_id,
    workContent: raw.work_content,
    surveyResults: raw.survey_results,
    dealAnswer: raw.deal_answer,
    customerImpact: raw.customer_impact,
    correspondingNote: raw.corresponding_note,
    acceptanceId: raw.acceptance_id,
    slipIssuanceId: raw.slip_issuance_id,
    itemUpdaterId: raw.item_updater_id,
    requestCategoryId: raw.request_category_id,
    classificationId: raw.classification_id,
    businessId: raw.business_id,
    emergencyId: raw.emergency_id,
    impactId: raw.impact_id,
    priorityId: raw.priority_id,
    causeId: raw.cause_id,
    dealId: raw.deal_id,
    severityId: raw.severity_id,
    workStartTime: raw.work_start_time,
    workEndTime: raw.work_end_time,
    occurrenceDate: raw.occurrence_date,
    mailFlag: raw.mailFlag ?? raw.mail_flag,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  } as T;
}