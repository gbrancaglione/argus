export type Account = {
  id: string;
  name: string;
  type: string;
  subtype: string;
  balance: number;
  currencyCode: string;
};

export type Transaction = {
  id: string;
  accountId: string;
  date: string;
  amount: number;
  description: string;
  category: string | null;
  type: "DEBIT" | "CREDIT";
  status: string;
  currencyCode: string;
};

export type Label = {
  id: number;
  name: string;
};

export type LocalTransaction = {
  id: number;
  external_id: string;
  date: string;
  amount: number;
  amount_brl: number | null;
  currency_code: string;
  description: string;
  category: string | null;
  label_id: number | null;
  category_edited: boolean;
  original_category: string | null;
  transaction_type: "DEBIT" | "CREDIT";
  status: string;
  account_id: number;
  sync_action?: "created" | "updated" | null;
};

export type TransactionsResponse = {
  page: number;
  total: number;
  totalPages: number;
  results: Transaction[];
};

export type PeriodSummary = {
  spent: number;
  count: number;
};

export type SpendingSummary = {
  total_spent: number;
  monthly: Record<string, PeriodSummary>;
  daily: Record<string, PeriodSummary>;
  transaction_count: number;
};

export type CategoryBreakdown = {
  category: string | null;
  spent: number;
  count: number;
};

export type CreditCardSummary = SpendingSummary & {
  by_category: CategoryBreakdown[];
};

export type LocalTransactionsResponse = {
  page: number;
  total: number;
  total_pages: number;
  results: LocalTransaction[];
};

export type SyncLog = {
  id: number;
  status: "running" | "completed" | "failed";
  from_date: string;
  to_date: string;
  accounts_synced: number;
  transactions_created: number;
  transactions_updated: number;
  transactions_skipped: number;
  error_message: string | null;
  approval_status: "pending" | "approved" | "rejected" | null;
  approved_at: string | null;
  started_at: string;
  finished_at: string | null;
};

export type PeriodStats = {
  total_spent: number;
  transaction_count: number;
  daily_average: number;
  from: string;
  to: string;
};

export type TopCategory = {
  category: string | null;
  spent: number;
  count: number;
  percentage: number;
};

export type AnalyticsData = {
  current_period: PeriodStats;
  previous_period: PeriodStats;
  monthly_trend: Record<string, PeriodSummary>;
  category_trend: Record<string, Record<string, number>>;
  top_categories: TopCategory[];
};

export type SpendingPaceMonth = {
  label: string;
  days: Record<number, number>;
  total: number;
};

export type SpendingPaceData = {
  months: Record<string, SpendingPaceMonth>;
  today: number;
  current_month: string;
};

export type LocalAccount = {
  id: number;
  external_id: string;
  name: string;
  account_type: string;
  account_subtype: string | null;
  currency_code: string;
  balance: number;
};
