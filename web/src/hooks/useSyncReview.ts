import { useState, useCallback } from "react";
import { fetchSyncTransactions, fetchSyncLogs } from "../api/spending";
import type { LocalTransaction, SyncLog } from "../types/spending";

type ActionFilter = "all" | "created" | "updated";

export function useSyncReview(syncId: number) {
  const [syncLog, setSyncLog] = useState<SyncLog | null>(null);
  const [transactions, setTransactions] = useState<LocalTransaction[]>([]);
  const [actionFilter, setActionFilter] = useState<ActionFilter>("all");
  const [page, setPageState] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadTransactions = useCallback(
    async (filter: ActionFilter, pageNum = 1) => {
      setLoading(true);
      setError("");
      try {
        const res = await fetchSyncTransactions({
          syncId,
          syncAction: filter === "all" ? undefined : filter,
          page: pageNum,
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
    },
    [syncId]
  );

  const init = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [logs] = await Promise.all([
        fetchSyncLogs(),
        loadTransactions("all"),
      ]);
      const log = logs.find((l) => l.id === syncId);
      if (log) setSyncLog(log);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [syncId, loadTransactions]);

  const changeFilter = useCallback(
    (filter: ActionFilter) => {
      setActionFilter(filter);
      loadTransactions(filter);
    },
    [loadTransactions]
  );

  const changePage = useCallback(
    (newPage: number) => {
      loadTransactions(actionFilter, newPage);
    },
    [actionFilter, loadTransactions]
  );

  const updateTransaction = useCallback(
    (id: number, updates: Partial<LocalTransaction>) => {
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
      );
    },
    []
  );

  const removeTransaction = useCallback((id: number) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    syncLog,
    transactions,
    actionFilter,
    page,
    totalPages,
    total,
    loading,
    error,
    init,
    changeFilter,
    changePage,
    setSyncLog,
    updateTransaction,
    removeTransaction,
  };
}
