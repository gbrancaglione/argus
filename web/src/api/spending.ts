import { apiRequest } from "./client";
import type {
  Account,
  TransactionsResponse,
  SpendingSummary,
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
