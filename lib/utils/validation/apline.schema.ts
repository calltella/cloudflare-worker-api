import { z } from "zod";

export const baseAplineSchema = z.object({


  title: z.string().min(1, "タイトルは必須です"),

  organization: z.string().optional(),

  responsible: z.string().optional(),

  statusId: z.coerce.number().int().positive({
    message: "ステータスは必須です",
  }),

  subsystem_id: z.coerce.number().int().positive({
    message: "サブシステムは必須です",
  }),

  workContent: z.string().optional(),
  surveyResults: z.string().optional(),
  dealAnswer: z.string().optional(),

  customerImpact: z.string().optional(),
  correspondingNote: z.string().optional(),

  // acceptanceId: z.coerce.number().int().positive({
  //   message: "受入は必須です",
  // }),
  // slipIssuanceId: z.coerce.number().int().positive({
  //   message: "伝票発行は必須です",
  // }),
  // itemUpdaterId: z.coerce.number().int().positive({
  //   message: "更新者は必須です",
  // }),
  requestCategoryId: z.coerce.number().int().positive({
    message: "リクエストカテゴリは必須です",
  }),
  classificationId: z.coerce.number().int().positive({
    message: "分類は必須です",
  }),
  subsystemId: z.coerce.number().int().positive({
    message: "サブシステムは必須です",
  }),
  businessId: z.coerce.number().int().positive({
    message: "業務は必須です",
  }),
  emergencyId: z.coerce.number().int().positive({
    message: "緊急度は必須です",
  }),
  impactId: z.coerce.number().int().positive({
    message: "影響度は必須です",
  }),
  priorityId: z.coerce.number().int().positive({
    message: "優先度は必須です",
  }),
  causeId: z.coerce.number().int().positive({
    message: "原因は必須です",
  }),
  dealId: z.coerce.number().int().positive({
    message: "対処は必須です",
  }),
  severityId: z.coerce.number().int().positive({
    message: "重要度は必須です",
  }),
  occurrenceDate: z.string().min(1, "発生日時は必須です"),


  //発生//
  reception: z.string().min(1, "受付日時は必須です"),
  workStartTime: z.string().optional(),
  workEndTime: z.string().optional(),


  mailFlag: z
    .union([z.literal("on"), z.undefined()])
    .transform((v) => v === "on"),
});

// 更新用（idが必須）
export const updateAplineSchema = baseAplineSchema.extend({
  id: z.coerce.number().int().positive()
});

// 新規用（idなし）
export const createAplineSchema = baseAplineSchema;

export type UpdateAplineInput = z.infer<typeof updateAplineSchema>;
export type CreateAplineInput = z.infer<typeof createAplineSchema>;