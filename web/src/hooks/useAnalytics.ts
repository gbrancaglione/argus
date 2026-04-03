import { useState, useCallback } from "react";
import { fetchCreditCardAnalytics } from "../api/spending";
import type { AnalyticsData } from "../types/spending";

function formatDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function defaultFrom() {
  const d = new Date();
  d.setMonth(d.getMonth() - 6);
  return formatDate(d);
}

function defaultTo() {
  return formatDate(new Date());
}

export function useAnalytics() {
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [granularity, setGranularityState] = useState<"month" | "week" | "day">("month");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (fromDate: string, toDate: string, gran: string) => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchCreditCardAnalytics({ from: fromDate, to: toDate, granularity: gran });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  const init = useCallback(() => {
    load(defaultFrom(), defaultTo(), "month");
  }, [load]);

  const setRange = useCallback((newFrom: string, newTo: string) => {
    setFrom(newFrom);
    setTo(newTo);
    load(newFrom, newTo, granularity);
  }, [load, granularity]);

  const setGranularity = useCallback((gran: "month" | "week" | "day") => {
    setGranularityState(gran);
    load(from, to, gran);
  }, [load, from, to]);

  return { from, to, granularity, data, loading, error, init, setRange, setGranularity };
}
