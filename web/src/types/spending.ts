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
