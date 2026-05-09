/**
 * Apline関連のUIで使用する型定義
 *  - AplineListDTO: 一覧表示用のデータ構造
 *  - AplineDetailListDTO: 詳細表示用のデータ構造（AplineListDTOを拡張）
 *  - AplineSingleDTO: 編集用のデータ構造（AplineDetailListDTOをさらに拡張）
 *  - AplineSearchFilter: 検索フィルターの構造
 *  - TenpoListSelectFilter: 店舗リストのセレクトボックス用構造
 *  - UploadFileMeta: ファイルアップロードのメタ情報構造
 *  - AplineAttachFile: 添付ファイルの構造
 * 
 * これらの型定義は、Apline関連のコンポーネントやサービスで使用されます。
 * 例えば、AplineListViewコンポーネントではAplineListDTOを使用して一覧表示を行い、
 * AplineDetailModalコンポーネントではAplineDetailDTOを使用して詳細表示を行います。
 * AplineSearchFilterは、AplineSearchBarコンポーネントで検索条件を管理するために使用されます。
 * TenpoListSelectFilterは、店舗リストのセレクトボックスで使用されます。
 * UploadFileMetaとAplineAttachFileは、ファイルのアップロードや添付に関連する機能で使用されます。
 * 
 * これらの型定義を使用することで、コードの可読性や保守性が向上し、型安全な開発が可能になります。
 */

// Apline一覧表示用DTO
export type AplineListDTO = {
  id: number;
  title: string | null;
  apid: string | null;

  // 顧客組織名
  organization: string | null;

  // 顧客担当者
  responsible: string | null;

  // 受付内容
  workContent: string | null;

  // 対処
  dealAnswer: string | null;

  // ステータス
  statusId: number | null;
  status: string | null;

  // 発生時間
  occurrenceDate: string | null;

  // 受付時間 / 終了時間 / 更新時間
  workStartTime: string | null;
  workEndtime: string | null;
  updatedAt: string | null;

  // 受付ユーザー名
  acceptanceUserName: string | null;

  // 更新者
  updateUserName: string | null;

  // フラグ
  favorite: boolean;
  isUnread: boolean;
  mailFlag: boolean;

  // 調査結果
  surveyResults: string;

  // 顧客影響
  customerImpact: string;

  // 対応メモ
  correspondingNote: string;

  // 添付ファイル
  files: AplineAttachFile[];
};

// 一覧表示用DTOをベースに、詳細表示用のDTOを定義
export type AplineDetailListDTO = AplineListDTO & {
  surveyResults: string;
  customerImpact: string;
  correspondingNote: string;
};

// Apline編集用DTO（AplineDetailListDTOをさらに拡張）
export type AplineSingleDTO = AplineDetailListDTO & {
  requestCategoryId: number;
  classificationId: number;
  subsystemId: number;
  businessId: number;
  severityId: number;
  emergencyId: number;
  impactId: number;
  priorityId: number;
  causeId: number;
  dealId: number;

  acceptanceId: number; // 削除で利用

  reception: string;
  workStartTime: string;
  workEndTime: string;
};

// 検索メニュー
export type AplineSearchFilter = {
  shopId: string,
  keyword: string;
  unreadOnly: boolean;
  incompleteOnly: boolean;
};

// セレクトボックス用
export type TenpoListSelectFilter = {
  id: number;
  pulldownName: string;
  registName: string;
}

// 添付ファイル用
export type UploadFileMeta = {
  path: string;
  ext: string;
  md5Hash: string;
  downloadKey: string;
  size: number;
  contentType: string;
};

// 添付ファイルの構造
export type AplineAttachFile = {
  id: number;
  fileName: string;
  downloadKey: string;
}