

export type SelectItem = {
  id: number;
  label: string;
};

export type AplineTenpoList = {
  id: number;
  tencd: number;
  pulldownName: string;
  registName: string;
};

export type AplineSelectItems = {
  aplineStatus: SelectItem[];
  aplineCause: SelectItem[];
  aplineClassification: SelectItem[];
  aplineDeal: SelectItem[];
  aplineEmergency: SelectItem[];
  aplineImpact: SelectItem[];
  aplinePriority: SelectItem[];
  aplineRequestCategory: SelectItem[];
  aplineSeverity: SelectItem[];
  aplineSubsystem: SelectItem[];
  aplineBusinessLists: SelectItem[];
  tenpoLists: AplineTenpoList[];
};

/**
 * Apline 新規投稿用
 */
export type CreateAplineInput = {
  title: string;
  statusId: number;
  subsystem_id: number;
  requestCategoryId: number;
  classificationId: number;
  subsystemId: number;
  businessId: number;
  emergencyId: number;
  impactId: number;
  priorityId: number;
  causeId: number;
  dealId: number;
  severityId: number;
  occurrenceDate: string;
  reception: string;
  mailFlag: boolean;
  organization?: string | undefined;
  responsible?: string | undefined;
  workContent?: string | undefined;
  surveyResults?: string | undefined;
  dealAnswer?: string | undefined;
  customerImpact?: string | undefined;
  correspondingNote?: string | undefined;
  workStartTime?: string | undefined;
  workEndTime?: string | undefined;
}
