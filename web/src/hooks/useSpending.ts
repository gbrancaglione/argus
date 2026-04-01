import { useState, useCallback } from "react";
import { fetchAccounts, fetchTransactions, fetchSpendingSummary } from "../api/spending";
import type { Account, Transaction, SpendingSummary } from "../types/spending";

function getDefaultRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const from = `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(y, m + 1, 0).getDate();
  const to = `${y}-${String(m + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
}

export function useSpending() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setAccountId] = useState("");
  const [dateRange, setDateRange] = useState(getDefaultRange);
  const [viewMode, setViewMode] = useState<"monthly" | "daily">("daily");
  const [summary, setSummary] = useState<SpendingSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const loadTransactions = useCallback((accountId: string, from: string, to: string, pg: number) => {
    setLoading(true);
    fetchTransactions({ accountId, from, to, page: pg, pageSize: 50 })
      .then((txData) => {
        setTransactions(txData.results);
        setTotalPages(txData.totalPages);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const loadAll = useCallback((accountId: string, from: string, to: string, pg: number) => {
    setLoading(true);
    setError(null);

    Promise.all([
      fetchSpendingSummary({ accountId, from, to }),
      fetchTransactions({ accountId, from, to, page: pg, pageSize: 50 }),
    ])
      .then(([summaryData, txData]) => {
        setSummary(summaryData);
        setTransactions(txData.results);
        setTotalPages(txData.totalPages);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const init = useCallback(() => {
    if (ready) return;
    setLoading(true);

    fetchAccounts()
      .then((data) => {
        setReady(true);
        setAccounts(data.results);
        const firstId = data.results[0]?.id ?? "";
        setAccountId(firstId);
        if (firstId) {
          const range = getDefaultRange();
          loadAll(firstId, range.from, range.to, 1);
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [ready, loadAll]);

  const setSelectedAccountId = useCallback((accountId: string) => {
    setAccountId(accountId);
    setPageNum(1);
    loadAll(accountId, dateRange.from, dateRange.to, 1);
  }, [loadAll, dateRange]);

  const setRange = useCallback((from: string, to: string) => {
    setDateRange({ from, to });
    setPageNum(1);
    loadAll(selectedAccountId, from, to, 1);
  }, [loadAll, selectedAccountId]);

  const setPage = useCallback((newPage: number) => {
    setPageNum(newPage);
    loadTransactions(selectedAccountId, dateRange.from, dateRange.to, newPage);
  }, [loadTransactions, selectedAccountId, dateRange]);

  return {
    accounts,
    selectedAccountId,
    setSelectedAccountId,
    dateRange,
    setRange,
    viewMode,
    setViewMode,
    summary,
    transactions,
    page,
    setPage,
    totalPages,
    loading,
    error,
    init,
  };
}
