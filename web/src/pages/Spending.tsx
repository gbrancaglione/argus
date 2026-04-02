import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import { useSpending } from "../hooks/useSpending";
import { formatBRL } from "../utils/format";
import Button from "../components/Button";
import SummaryCard from "../components/SummaryCard";
import DateRangePicker from "../components/DateRangePicker";
import TabBar from "../components/TabBar";
import MonthlyGrid from "../components/MonthlyGrid";
import DailyList from "../components/DailyList";
import TransactionList from "../components/TransactionList";

const VIEW_TABS = [
  { key: "daily", label: "Diário" },
  { key: "monthly", label: "Mensal" },
];

export default function Spending() {
  const { isAuthenticated, user, signOut } = useAuth();
  const {
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
  } = useSpending();

  useEffect(() => { init(); }, [init]);

  if (!isAuthenticated) return <Navigate to="/signin" replace />;

  const currentMonth = dateRange.from.substring(0, 7);

  return (
    <div className="min-h-screen bg-neutral-bg">
      <header className="flex items-center justify-between px-6 py-4 bg-neutral-white shadow-level-1">
        <h1 className="font-heading text-2xl font-black text-brand-primary">Argus</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-neutral-medium">{user?.email}</span>
          <Button variant="tertiary" size="small" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h2 className="font-heading text-xl font-black text-neutral-darkest">Gastos</h2>
          <div className="flex items-center gap-3">
            {accounts.length > 1 && (
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="border border-neutral-light rounded-lg px-3 py-2 text-sm text-neutral-darkest bg-neutral-white"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.type})
                  </option>
                ))}
              </select>
            )}
            <DateRangePicker from={dateRange.from} to={dateRange.to} onChange={setRange} />
          </div>
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
        ) : (
          <>
            {summary && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <SummaryCard label="Total gasto" value={formatBRL(summary.total_spent)} />
                <SummaryCard label="Transações" value={String(summary.transaction_count)} />
                <SummaryCard
                  label="Média diária"
                  value={formatBRL(
                    Object.keys(summary.daily).length > 0
                      ? summary.total_spent / Object.keys(summary.daily).length
                      : 0
                  )}
                />
              </div>
            )}

            <div className="mb-6">
              <TabBar
                tabs={VIEW_TABS}
                activeTab={viewMode}
                onChange={(key) => setViewMode(key as "daily" | "monthly")}
              />
            </div>

            {summary && viewMode === "monthly" && (
              <div className="mb-8">
                <MonthlyGrid monthly={summary.monthly} currentMonth={currentMonth} />
              </div>
            )}

            {summary && viewMode === "daily" && (
              <div className="mb-8">
                <DailyList daily={summary.daily} />
              </div>
            )}

            <div>
              <h3 className="font-heading font-black text-lg text-neutral-darkest mb-4">Transações</h3>
              <TransactionList
                transactions={transactions}
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
