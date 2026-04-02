import { useState, useCallback } from "react";
import {
  triggerSync,
  fetchSyncLogs,
  fetchLocalAccounts,
} from "../api/spending";
import type { SyncLog, LocalAccount } from "../types/spending";

function defaultFrom() {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function defaultTo() {
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, "0")}-${String(last.getDate()).padStart(2, "0")}`;
}

export function useSync() {
  const [accounts, setAccounts] = useState<LocalAccount[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["CREDIT"]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [lastResult, setLastResult] = useState<SyncLog | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [accountsRes, logs] = await Promise.all([
        fetchLocalAccounts(),
        fetchSyncLogs(),
      ]);
      setAccounts(accountsRes.results);
      setSyncLogs(logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  const syncNow = useCallback(async () => {
    setSyncing(true);
    setError("");
    setLastResult(null);
    try {
      const log = await triggerSync({
        from,
        to,
        account_types: selectedTypes.length > 0 ? selectedTypes : undefined,
      });
      setLastResult(log);
      // Refresh data after sync
      const [accountsRes, logs] = await Promise.all([
        fetchLocalAccounts(),
        fetchSyncLogs(),
      ]);
      setAccounts(accountsRes.results);
      setSyncLogs(logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }, [from, to, selectedTypes]);

  return {
    accounts,
    syncLogs,
    from,
    setFrom,
    to,
    setTo,
    selectedTypes,
    setSelectedTypes,
    loading,
    syncing,
    error,
    lastResult,
    loadData,
    syncNow,
  };
}
