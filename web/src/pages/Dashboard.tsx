import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCreditCardSummary, fetchSyncLogs } from "../api/spending";
import { formatBRL } from "../utils/format";
import type { CreditCardSummary, SyncLog } from "../types/spending";
import SummaryCard from "../components/SummaryCard";

function formatDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function currentMonthRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: formatDate(from), to: formatDate(to) };
}

function formatDateBR(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<CreditCardSummary | null>(null);
  const [lastSync, setLastSync] = useState<SyncLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const range = currentMonthRange();
        const [summaryRes, logs] = await Promise.all([
          fetchCreditCardSummary(range),
          fetchSyncLogs(),
        ]);
        setSummary(summaryRes);
        const completedLogs = logs.filter((l) => l.status === "completed");
        if (completedLogs.length > 0) setLastSync(completedLogs[0]);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const topCategories = summary?.by_category.slice(0, 3) ?? [];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h2 className="font-heading text-xl font-black text-neutral-darkest mb-6">
        Dashboard
      </h2>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-brand-primary-lightest border-t-brand-primary rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <SummaryCard
              label="Gasto este mês"
              value={formatBRL(summary?.total_spent ?? 0)}
            />
            <SummaryCard
              label="Transações"
              value={String(summary?.transaction_count ?? 0)}
            />
            <SummaryCard
              label="Última sincronização"
              value={
                lastSync
                  ? formatDateBR(lastSync.started_at.split("T")[0])
                  : "Nenhuma"
              }
            />
          </div>

          {/* Top categories */}
          <div className="bg-neutral-white rounded-lg shadow-level-1 p-6 mb-8">
            <h3 className="font-heading font-black text-lg text-neutral-darkest mb-4">
              Top categorias do mês
            </h3>
            {topCategories.length === 0 ? (
              <p className="text-sm text-neutral-medium">
                Nenhum dado ainda. Sincronize seus dados primeiro.
              </p>
            ) : (
              <div className="space-y-3">
                {topCategories.map((cat, i) => {
                  const percentage =
                    summary && summary.total_spent > 0
                      ? (cat.spent / summary.total_spent) * 100
                      : 0;
                  return (
                    <button
                      key={cat.category ?? "uncategorized"}
                      onClick={() =>
                        navigate(
                          `/credit-card/category/${encodeURIComponent(cat.category ?? "uncategorized")}`
                        )
                      }
                      className="w-full flex items-center gap-4 py-2 cursor-pointer hover:bg-neutral-bg rounded-lg px-2 transition-colors text-left"
                    >
                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-brand-primary-lightest text-brand-primary text-xs font-bold">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-neutral-darkest truncate">
                            {cat.category ?? "Sem categoria"}
                          </span>
                          <span className="font-heading font-black text-status-error text-sm ml-2">
                            {formatBRL(cat.spent)}
                          </span>
                        </div>
                        <div className="w-full bg-neutral-lightest rounded-full h-1.5">
                          <div
                            className="bg-brand-primary h-1.5 rounded-full transition-all"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => navigate("/credit-card")}
              className="bg-neutral-white rounded-lg shadow-level-1 p-5 text-left hover:bg-neutral-bg transition-colors cursor-pointer"
            >
              <h4 className="font-heading font-black text-neutral-darkest mb-1">
                Cartão de Crédito
              </h4>
              <p className="text-sm text-neutral-medium">
                Ver todas as transações e categorias
              </p>
            </button>
            <button
              onClick={() => navigate("/analytics")}
              className="bg-neutral-white rounded-lg shadow-level-1 p-5 text-left hover:bg-neutral-bg transition-colors cursor-pointer"
            >
              <h4 className="font-heading font-black text-neutral-darkest mb-1">
                Analytics
              </h4>
              <p className="text-sm text-neutral-medium">
                Tendências e insights dos seus gastos
              </p>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
