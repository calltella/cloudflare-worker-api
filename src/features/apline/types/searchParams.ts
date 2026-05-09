

/**
 * urlパラメータ
 * page: ページ番号
 * shopId: 検索（店舗番号）
 * q: 検索文字
 * unread: 未読フラグ
 * incomplete: 未完了フラグ
 * category: カテゴリクラス
 */

// システム監視（３）requestC
// ategoryId
type Category = "all" | "monitoring" | "non-monitoring";

// urlパラメータ用型
export type AplineSearchParams = {
  page?: string;
  shopId?: string;
  keyword?: string;
  unread?: string;
  incomplete?: string;
  category?: Category;
};
