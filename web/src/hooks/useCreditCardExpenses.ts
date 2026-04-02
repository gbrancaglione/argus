import { useState, useCallback } from "react";
import {
  fetchCreditCardExpenses,
  fetchCreditCardSummary,
} from "../api/spending";
import type {
  LocalTransaction,
  CreditCardSummary,
} from "../types/spending";

function defaultFrom() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function defaultTo() {
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, "0")}-${String(last.getDate()).padStart(2, "0")}`;
}

export function useCreditCardExpenses() {
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [viewMode, setViewMode] = useState<"transactions" | "category">("transactions");
  const [summary, setSummary] = useState<CreditCardSummary | null>(null);
  const [transactions, setTransactions] = useState<LocalTransaction[]>([]);
  const [page, setPageState] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadAll = useCallback(async (fromDate: string, toDate: string, pageNum = 1) => {
    setLoading(true);
    setError("");
    try {
      const [summaryRes, txRes] = await Promise.all([
        fetchCreditCardSummary({ from: fromDate, to: toDate }),
        fetchCreditCardExpenses({ from: fromDate, to: toDate, page: pageNum }),
      ]);
      setSummary(summaryRes);
      setTransactions(txRes.results);
      setTotalPages(txRes.total_pages);
      setPageState(txRes.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTransactions = useCallback(async (fromDate: string, toDate: string, pageNum: number) => {
    setLoading(true);
    setError("");
    try {
      const txRes = await fetchCreditCardExpenses({ from: fromDate, to: toDate, page: pageNum });
      setTransactions(txRes.results);
      setTotalPages(txRes.total_pages);
      setPageState(txRes.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, []);

  const init = useCallback(() => {
    loadAll(defaultFrom(), defaultTo());
  }, [loadAll]);

  const setRange = useCallback((newFrom: string, newTo: string) => {
    setFrom(newFrom);
    setTo(newTo);
    setPageState(1);
    loadAll(newFrom, newTo, 1);
  }, [loadAll]);

  const setPage = useCallback((newPage: number) => {
    loadTransactions(from, to, newPage);
  }, [from, to, loadTransactions]);

  const updateTransaction = useCallback((id: number, updates: Partial<LocalTransaction>) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  }, []);

  const removeTransaction = useCallback((id: number) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    from,
    to,
    viewMode,
    setViewMode,
    summary,
    transactions,
    page,
    totalPages,
    loading,
    error,
    init,
    setRange,
    setPage,
    updateTransaction,
    removeTransaction,
  };
}
