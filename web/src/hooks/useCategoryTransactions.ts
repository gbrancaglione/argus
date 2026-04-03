import { useState, useCallback } from "react";
import { fetchCreditCardExpenses } from "../api/spending";
import type { LocalTransaction } from "../types/spending";

function formatDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function defaultFrom() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return formatDate(d);
}

function defaultTo() {
  return formatDate(new Date());
}

export function useCategoryTransactions(categoryName: string) {
  const labelName = categoryName === "uncategorized" ? "uncategorized" : categoryName;

  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [transactions, setTransactions] = useState<LocalTransaction[]>([]);
  const [page, setPageState] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (fromDate: string, toDate: string, pageNum = 1) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchCreditCardExpenses({
        from: fromDate,
        to: toDate,
        page: pageNum,
        labelName,
      });
      setTransactions(res.results);
      setTotalPages(res.total_pages);
      setPageState(res.page);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [labelName]);

  const init = useCallback(() => {
    load(defaultFrom(), defaultTo());
  }, [load]);

  const setRange = useCallback((newFrom: string, newTo: string) => {
    setFrom(newFrom);
    setTo(newTo);
    setPageState(1);
    load(newFrom, newTo, 1);
  }, [load]);

  const setPage = useCallback((newPage: number) => {
    load(from, to, newPage);
  }, [from, to, load]);

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
    transactions,
    page,
    totalPages,
    total,
    loading,
    error,
    init,
    setRange,
    setPage,
    updateTransaction,
    removeTransaction,
  };
}
