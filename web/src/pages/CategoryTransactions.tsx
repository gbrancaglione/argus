import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCategoryTransactions } from "../hooks/useCategoryTransactions";
import { formatBRL } from "../utils/format";
import type { LocalTransaction } from "../types/spending";
import DateRangePicker from "../components/DateRangePicker";
import SummaryCard from "../components/SummaryCard";
import CreditCardTransactionRow from "../components/CreditCardTransactionRow";
import TransactionDetailModal from "../components/TransactionDetailModal";

export default function CategoryTransactions() {
  const { categoryName: rawCategory } = useParams<{ categoryName: string }>();
  const navigate = useNavigate();
  const categoryName = decodeURIComponent(rawCategory ?? "");
  const displayName = categoryName === "uncategorized" ? "Sem categoria" : categoryName;

  const {
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
  } = useCategoryTransactions(categoryName);

  const [selectedTx, setSelectedTx] = useState<LocalTransaction | null>(null);

  useEffect(() => {
    init();
  }, [init]);

  const totalSpent = transactions.reduce(
    (sum, tx) => sum + (tx.amount_brl ?? tx.amount),
    0
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/credit-card")}
          className="w-10 h-10 flex items-center justify-center rounded-lg border border-neutral-light text-neutral-dark hover:bg-brand-primary-lightest cursor-pointer"
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
        <div className="flex-1 flex items-center justify-between gap-4">
          <h2 className="font-heading text-xl font-black text-neutral-darkest">
            {displayName}
          </h2>
          <DateRangePicker from={from} to={to} onChange={setRange} />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <SummaryCard label="Total gasto" value={formatBRL(totalSpent)} />
            <SummaryCard label="Transações" value={String(total)} />
          </div>

          {transactions.length === 0 ? (
            <p className="text-neutral-medium text-sm py-8 text-center">
              Nenhuma transação encontrada nesta categoria.
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
        </>
      )}

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
