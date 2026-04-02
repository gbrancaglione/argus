import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import { useCreditCardExpenses } from "../hooks/useCreditCardExpenses";
import { formatBRL } from "../utils/format";
import type { LocalTransaction } from "../types/spending";
import Button from "../components/Button";
import SummaryCard from "../components/SummaryCard";
import DateRangePicker from "../components/DateRangePicker";
import TabBar from "../components/TabBar";
import CategoryList from "../components/CategoryList";
import CreditCardTransactionRow from "../components/CreditCardTransactionRow";
import TransactionDetailModal from "../components/TransactionDetailModal";

const VIEW_TABS = [
  { key: "transactions", label: "Transações" },
  { key: "category", label: "Categoria" },
];

export default function CreditCardExpenses() {
  const { isAuthenticated, user, signOut } = useAuth();
  const {
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
  } = useCreditCardExpenses();

  const [selectedTx, setSelectedTx] = useState<LocalTransaction | null>(null);

  useEffect(() => {
    init();
  }, [init]);

  if (!isAuthenticated) return <Navigate to="/signin" replace />;

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
          <h2 className="font-heading text-xl font-black text-neutral-darkest">
            Cartão de Crédito
          </h2>
          <DateRangePicker from={from} to={to} onChange={setRange} />
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
                <SummaryCard
                  label="Transações"
                  value={String(summary.transaction_count)}
                />
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
                onChange={(key) =>
                  setViewMode(key as "transactions" | "category")
                }
              />
            </div>

            {summary && viewMode === "category" && (
              <div className="mb-8">
                <CategoryList
                  categories={summary.by_category}
                  totalSpent={summary.total_spent}
                />
              </div>
            )}

            {viewMode === "transactions" && (
            <div>
              {transactions.length === 0 ? (
                <p className="text-neutral-medium text-sm py-8 text-center">
                  Nenhuma transação encontrada. Sincronize seus dados primeiro.
                </p>
              ) : (
                <div>
                  <div className="bg-neutral-white rounded-lg shadow-level-1 px-5">
                    {transactions.map((tx) => (
                      <CreditCardTransactionRow
                        key={tx.id}
                        transaction={tx}
                        onClick={setSelectedTx}
                      />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <button
                        onClick={() => setPage(page - 1)}
                        disabled={page <= 1}
                        className="w-10 h-10 flex items-center justify-center rounded-lg border border-neutral-light text-neutral-dark hover:bg-brand-primary-lightest disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                          <path
                            d="M12.5 15L7.5 10L12.5 5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                      <span className="text-sm text-neutral-medium px-2">
                        {page} / {totalPages}
                      </span>
                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={page >= totalPages}
                        className="w-10 h-10 flex items-center justify-center rounded-lg border border-neutral-light text-neutral-dark hover:bg-brand-primary-lightest disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                          <path
                            d="M7.5 5L12.5 10L7.5 15"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            )}
          </>
        )}
      </main>

      {selectedTx && (
        <TransactionDetailModal
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
          onUpdate={updateTransaction}
          onDelete={removeTransaction}
        />
      )}
    </div>
  );
}
