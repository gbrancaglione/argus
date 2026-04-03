import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAnalytics } from "../hooks/useAnalytics";
import { fetchCreditCardExpenses } from "../api/spending";
import { formatBRL } from "../utils/format";
import type { LocalTransaction } from "../types/spending";
import DateRangePicker from "../components/DateRangePicker";
import PeriodPresetBar from "../components/PeriodPresetBar";
import GranularityToggle from "../components/GranularityToggle";
import PeriodComparisonCard from "../components/PeriodComparisonCard";
import SpendingTrendChart from "../components/SpendingTrendChart";
import CategoryTrendChart from "../components/CategoryTrendChart";
import MonthOverMonthTable from "../components/MonthOverMonthTable";
import CreditCardTransactionRow from "../components/CreditCardTransactionRow";
import TransactionDetailModal from "../components/TransactionDetailModal";

const MONTH_LABELS: Record<string, string> = {
  "01": "Janeiro", "02": "Fevereiro", "03": "Março", "04": "Abril",
  "05": "Maio", "06": "Junho", "07": "Julho", "08": "Agosto",
  "09": "Setembro", "10": "Outubro", "11": "Novembro", "12": "Dezembro",
};

function monthLabel(yyyyMm: string) {
  const [y, m] = yyyyMm.split("-");
  return `${MONTH_LABELS[m] ?? m} ${y}`;
}

function monthRange(yyyyMm: string) {
  const [y, m] = yyyyMm.split("-");
  const year = Number(y);
  const month = Number(m);
  const from = `${y}-${m}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${y}-${m}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
}

export default function Analytics() {
  const navigate = useNavigate();
  const { from, to, granularity, data, loading, error, init, setRange, setGranularity } = useAnalytics();

  // Month drill-down state
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [monthTxs, setMonthTxs] = useState<LocalTransaction[]>([]);
  const [monthTxPage, setMonthTxPage] = useState(1);
  const [monthTxTotalPages, setMonthTxTotalPages] = useState(1);
  const [monthTxLoading, setMonthTxLoading] = useState(false);
  const [selectedTx, setSelectedTx] = useState<LocalTransaction | null>(null);
  const monthDetailRef = useRef<HTMLDivElement>(null);

  const loadMonthTransactions = useCallback(async (month: string, page = 1) => {
    setMonthTxLoading(true);
    try {
      const range = monthRange(month);
      const res = await fetchCreditCardExpenses({ ...range, page });
      setMonthTxs(res.results);
      setMonthTxPage(res.page);
      setMonthTxTotalPages(res.total_pages);
    } catch (err) {
      console.error("Failed to load month transactions:", err);
    } finally {
      setMonthTxLoading(false);
    }
  }, []);

  function handleMonthClick(month: string) {
    if (selectedMonth === month) {
      setSelectedMonth(null);
      setMonthTxs([]);
      return;
    }
    setSelectedMonth(month);
    loadMonthTransactions(month);
  }

  useEffect(() => {
    if (selectedMonth) {
      monthDetailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedMonth]);

  function handleRangeChange(newFrom: string, newTo: string) {
    setRange(newFrom, newTo);
    setSelectedMonth(null);
    setMonthTxs([]);
  }

  useEffect(() => {
    init();
  }, [init]);

  const periods = data
    ? Object.keys(data.monthly_trend).sort()
    : [];

  const periodTotals = data
    ? Object.fromEntries(
        Object.entries(data.monthly_trend).map(([m, v]) => [m, v.spent])
      )
    : {};

  // Build category breakdown for selected month
  const monthCategories = selectedMonth && data
    ? Object.entries(data.category_trend)
        .map(([cat, byMonth]) => ({
          category: cat,
          spent: byMonth[selectedMonth] ?? 0,
        }))
        .filter((c) => c.spent > 0)
        .sort((a, b) => b.spent - a.spent)
    : [];

  const monthTotal = selectedMonth ? (periodTotals[selectedMonth] ?? 0) : 0;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="font-heading text-xl font-black text-neutral-darkest">
          Analytics
        </h2>
        <DateRangePicker from={from} to={to} onChange={handleRangeChange} />
      </div>

      {/* Period presets */}
      <div className="mb-6">
        <PeriodPresetBar activeFrom={from} activeTo={to} onSelect={handleRangeChange} />
      </div>

      {error && (
        <div className="bg-status-error-light text-status-error-dark rounded-lg px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-brand-primary-lightest border-t-brand-primary rounded-full animate-spin" />
        </div>
      ) : data ? (
        <>
          {/* Period comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <PeriodComparisonCard
              label="Total gasto"
              currentValue={formatBRL(data.current_period.total_spent)}
              currentRaw={data.current_period.total_spent}
              previousRaw={data.previous_period.total_spent}
              previousValue={formatBRL(data.previous_period.total_spent)}
            />
            <PeriodComparisonCard
              label="Transações"
              currentValue={String(data.current_period.transaction_count)}
              currentRaw={data.current_period.transaction_count}
              previousRaw={data.previous_period.transaction_count}
              previousValue={String(data.previous_period.transaction_count)}
            />
            <PeriodComparisonCard
              label="Média diária"
              currentValue={formatBRL(data.current_period.daily_average)}
              currentRaw={data.current_period.daily_average}
              previousRaw={data.previous_period.daily_average}
              previousValue={formatBRL(data.previous_period.daily_average)}
            />
          </div>

          {/* Spending trend chart */}
          <div className="bg-neutral-white rounded-lg shadow-level-1 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-black text-lg text-neutral-darkest">
                Gasto por período
                <span className="text-xs text-neutral-medium font-normal ml-2">
                  Clique em um período para detalhes
                </span>
              </h3>
              <GranularityToggle value={granularity} onChange={setGranularity} />
            </div>
            <SpendingTrendChart
              months={periods}
              categoryTrend={data.category_trend}
              monthlyTotals={periodTotals}
              selectedMonth={selectedMonth}
              onMonthClick={granularity === "month" ? handleMonthClick : undefined}
            />
          </div>

          {/* Month detail drill-down */}
          {selectedMonth && granularity === "month" && (
            <div ref={monthDetailRef} className="bg-neutral-white rounded-lg shadow-level-1 p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-black text-lg text-neutral-darkest">
                  {monthLabel(selectedMonth)}
                </h3>
                <button
                  onClick={() => { setSelectedMonth(null); setMonthTxs([]); }}
                  className="text-xs text-neutral-medium hover:text-neutral-dark cursor-pointer"
                >
                  Fechar
                </button>
              </div>

              {/* Month summary + category breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-xs text-neutral-medium mb-1">Total do mês</p>
                  <p className="font-heading font-black text-2xl text-neutral-darkest">
                    {formatBRL(monthTotal)}
                  </p>
                  <p className="text-xs text-neutral-medium mt-1">
                    {data.monthly_trend[selectedMonth]?.count ?? 0} transações
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-medium mb-2">Categorias</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {monthCategories.map((cat) => {
                      const pct = monthTotal > 0 ? (cat.spent / monthTotal * 100).toFixed(1) : "0.0";
                      const displayName = cat.category === "null" || cat.category == null
                        ? "Sem categoria" : cat.category;
                      return (
                        <div key={cat.category} className="flex items-center justify-between text-sm">
                          <span className="text-neutral-darkest truncate">{displayName}</span>
                          <div className="flex items-center gap-2 ml-2 shrink-0">
                            <span className="text-xs text-neutral-medium">{pct}%</span>
                            <span className="font-bold text-neutral-darkest">{formatBRL(cat.spent)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Month transactions */}
              <div className="border-t border-neutral-lightest pt-4">
                <p className="text-xs text-neutral-medium mb-3">Transações</p>
                {monthTxLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-4 border-brand-primary-lightest border-t-brand-primary rounded-full animate-spin" />
                  </div>
                ) : monthTxs.length === 0 ? (
                  <p className="text-neutral-medium text-sm py-4 text-center">
                    Nenhuma transação encontrada.
                  </p>
                ) : (
                  <>
                    <div className="bg-neutral-bg rounded-lg px-4">
                      {monthTxs.map((tx) => (
                        <CreditCardTransactionRow
                          key={tx.id}
                          transaction={tx}
                          onClick={setSelectedTx}
                        />
                      ))}
                    </div>
                    {monthTxTotalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-4">
                        <button
                          onClick={() => loadMonthTransactions(selectedMonth, monthTxPage - 1)}
                          disabled={monthTxPage <= 1}
                          className="w-10 h-10 flex items-center justify-center rounded-lg border border-neutral-light text-neutral-dark hover:bg-brand-primary-lightest disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        <span className="text-sm text-neutral-medium px-2">{monthTxPage} / {monthTxTotalPages}</span>
                        <button
                          onClick={() => loadMonthTransactions(selectedMonth, monthTxPage + 1)}
                          disabled={monthTxPage >= monthTxTotalPages}
                          className="w-10 h-10 flex items-center justify-center rounded-lg border border-neutral-light text-neutral-dark hover:bg-brand-primary-lightest disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                            <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Category trend line chart */}
          <div className="bg-neutral-white rounded-lg shadow-level-1 p-6 mb-8">
            <h3 className="font-heading font-black text-lg text-neutral-darkest mb-4">
              Tendência por categoria
            </h3>
            <CategoryTrendChart data={data.category_trend} months={periods} />
          </div>

          {/* Two-column: Top categories + Month over month */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Top categories */}
            <div className="bg-neutral-white rounded-lg shadow-level-1 p-6">
              <h3 className="font-heading font-black text-lg text-neutral-darkest mb-4">
                Top categorias
              </h3>
              {data.top_categories.length === 0 ? (
                <p className="text-neutral-medium text-sm py-4 text-center">
                  Sem dados para o período.
                </p>
              ) : (
                <div className="space-y-3">
                  {data.top_categories.map((cat, i) => (
                    <button
                      key={cat.category ?? "uncategorized"}
                      onClick={() =>
                        navigate(
                          `/credit-card/category/${encodeURIComponent(cat.category ?? "uncategorized")}`
                        )
                      }
                      className="w-full flex items-center gap-4 py-2 cursor-pointer hover:bg-neutral-bg rounded-lg px-2 transition-colors text-left"
                    >
                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-brand-primary-lightest text-brand-primary text-xs font-bold shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-neutral-darkest truncate">
                            {cat.category ?? "Sem categoria"}
                          </span>
                          <div className="flex items-center gap-2 ml-2 shrink-0">
                            <span className="text-xs text-neutral-medium">
                              {cat.percentage}%
                            </span>
                            <span className="font-heading font-black text-status-error text-sm">
                              {formatBRL(cat.spent)}
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-neutral-lightest rounded-full h-1.5">
                          <div
                            className="bg-brand-primary h-1.5 rounded-full transition-all"
                            style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Month over month changes */}
            <div className="bg-neutral-white rounded-lg shadow-level-1 p-6">
              <h3 className="font-heading font-black text-lg text-neutral-darkest mb-4">
                Variação entre períodos
              </h3>
              <MonthOverMonthTable data={data.monthly_trend} />
            </div>
          </div>
        </>
      ) : null}

      {selectedTx && (
        <TransactionDetailModal
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
          onUpdate={(id, updates) => {
            setMonthTxs((prev) =>
              prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
            );
          }}
          onDelete={(id) => {
            setMonthTxs((prev) => prev.filter((t) => t.id !== id));
          }}
        />
      )}
    </div>
  );
}
