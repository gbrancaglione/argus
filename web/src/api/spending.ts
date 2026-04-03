import { apiRequest } from "./client";
import type {
  Account,
  TransactionsResponse,
  SpendingSummary,
  LocalTransaction,
  LocalTransactionsResponse,
  CreditCardSummary,
  AnalyticsData,
  SpendingPaceData,
  SyncLog,
  LocalAccount,
  Label,
} from "../types/spending";

export function fetchAccounts() {
  return apiRequest<{ results: Account[] }>("/accounts");
}

export function fetchTransactions(params: {
  accountId: string;
  from: string;
  to: string;
  page?: number;
  pageSize?: number;
}) {
  const query = new URLSearchParams({
    account_id: params.accountId,
    from: params.from,
    to: params.to,
    page: String(params.page ?? 1),
    page_size: String(params.pageSize ?? 50),
  });
  return apiRequest<TransactionsResponse>(`/transactions?${query}`);
}

export function fetchSpendingSummary(params: {
  accountId: string;
  from: string;
  to: string;
}) {
  const query = new URLSearchParams({
    account_id: params.accountId,
    from: params.from,
    to: params.to,
  });
  return apiRequest<SpendingSummary>(`/transactions/summary?${query}`);
}

// — Local data endpoints —

export function triggerSync(params: {
  from: string;
  to: string;
  account_types?: string[];
}) {
  return apiRequest<SyncLog>("/syncs", {
    method: "POST",
    body: params,
  });
}

export function fetchSyncLogs() {
  return apiRequest<SyncLog[]>("/syncs");
}

export function fetchLocalAccounts() {
  return apiRequest<{ results: LocalAccount[] }>("/accounts");
}

export function fetchCreditCardExpenses(params: {
  from: string;
  to: string;
  page?: number;
  perPage?: number;
  labelName?: string;
}) {
  const query = new URLSearchParams({
    from: params.from,
    to: params.to,
    page: String(params.page ?? 1),
    per_page: String(params.perPage ?? 50),
  });
  if (params.labelName) query.set("label_name", params.labelName);
  return apiRequest<LocalTransactionsResponse>(`/credit_card_expenses?${query}`);
}

export function fetchCreditCardSummary(params: {
  from: string;
  to: string;
}) {
  const query = new URLSearchParams({
    from: params.from,
    to: params.to,
  });
  return apiRequest<CreditCardSummary>(`/credit_card_expenses/summary?${query}`);
}

export function fetchCreditCardAnalytics(params: {
  from: string;
  to: string;
  granularity?: string;
}) {
  const query = new URLSearchParams({
    from: params.from,
    to: params.to,
  });
  if (params.granularity) query.set("granularity", params.granularity);
  return apiRequest<AnalyticsData>(`/credit_card_expenses/analytics?${query}`);
}

export function fetchSpendingPace(months = 6) {
  const query = new URLSearchParams({ months: String(months) });
  return apiRequest<SpendingPaceData>(`/credit_card_expenses/spending_pace?${query}`);
}

export function fetchLabels() {
  return apiRequest<Label[]>("/labels");
}

export function createLabel(name: string) {
  return apiRequest<Label>("/labels", {
    method: "POST",
    body: { name },
  });
}

export function updateTransaction(
  id: number,
  updates: { label_id?: number | null; description?: string }
) {
  return apiRequest<LocalTransaction>(`/transactions/${id}`, {
    method: "PATCH",
    body: updates,
  });
}

export function deleteTransaction(id: number) {
  return apiRequest<void>(`/transactions/${id}`, { method: "DELETE" });
}
