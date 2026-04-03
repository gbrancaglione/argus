import { useEffect, useState, useCallback } from "react";
import { useCreditCardExpenses } from "../hooks/useCreditCardExpenses";
import { fetchCreditCardExpenses } from "../api/spending";
import { formatBRL } from "../utils/format";
import type { LocalTransaction } from "../types/spending";
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

  // Category drill-down state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [catTransactions, setCatTransactions] = useState<LocalTransaction[]>([]);
  const [catPage, setCatPage] = useState(1);
  const [catTotalPages, setCatTotalPages] = useState(1);
  const [catTotal, setCatTotal] = useState(0);
  const [catLoading, setCatLoading] = useState(false);

  const loadCategoryTransactions = useCallback(async (
    category: string,
    fromDate: string,
    toDate: string,
    pageNum = 1
  ) => {
    setCatLoading(true);
    try {
      const labelName = category === "uncategorized" ? "uncategorized" : category;
      const res = await fetchCreditCardExpenses({
        from: fromDate,
        to: toDate,
        page: pageNum,
        labelName,
      });
      setCatTransactions(res.results);
      setCatTotalPages(res.total_pages);
      setCatPage(res.page);
      setCatTotal(res.total);
    } catch (err) {
      console.error("Failed to load category transactions:", err);
    } finally {
      setCatLoading(false);
    }
  }, []);

  function handleSelectCategory(category: string | null) {
    const catKey = category ?? "uncategorized";
    setSelectedCategory(catKey);
    loadCategoryTransactions(catKey, from, to);
  }

  function handleBackToCategories() {
    setSelectedCategory(null);
    setCatTransactions([]);
  }

  function handleCatPageChange(newPage: number) {
    if (selectedCategory) {
      loadCategoryTransactions(selectedCategory, from, to, newPage);
    }
  }

  // When date range changes, reset category drill-down
  function handleRangeChange(newFrom: string, newTo: string) {
    setRange(newFrom, newTo);
    if (selectedCategory) {
      loadCategoryTransactions(selectedCategory, newFrom, newTo);
    }
  }

  // When switching tabs, clear category selection
  function handleTabChange(key: string) {
    setViewMode(key as "transactions" | "category");
    setSelectedCategory(null);
    setCatTransactions([]);
  }

  useEffect(() => {
    init();
  }, [init]);

  const displayName = selectedCategory === "uncategorized"
    ? "Sem categoria"
    : selectedCategory;

  const catTotalSpent = catTransactions.reduce(
    (sum, tx) => sum + (tx.amount_brl ?? tx.amount),
    0
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h2 className="font-heading text-xl font-black text-neutral-darkest">
          Cartão de Crédito
        </h2>
        <DateRangePicker from={from} to={to} onChange={handleRangeChange} />
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
          {summary && !selectedCategory && (
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
              onChange={handleTabChange}
            />
          </div>

          {/* Category drill-down view */}
          {viewMode === "category" && selectedCategory && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={handleBackToCategories}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-light text-neutral-dark hover:bg-brand-primary-lightest cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                    <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <h3 className="font-heading text-lg font-black text-neutral-darkest">
                  {displayName}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <SummaryCard label="Total gasto" value={formatBRL(catTotalSpent)} />
                <SummaryCard label="Transações" value={String(catTotal)} />
              </div>

              {catLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-brand-primary-lightest border-t-brand-primary rounded-full animate-spin" />
                </div>
              ) : catTransactions.length === 0 ? (
                <p className="text-neutral-medium text-sm py-8 text-center">
                  Nenhuma transação encontrada nesta categoria.
                </p>
              ) : (
                <div>
                  <div className="bg-neutral-white rounded-lg shadow-level-1 px-5">
                    {catTransactions.map((tx) => (
                      <CreditCardTransactionRow
                        key={tx.id}
                        transaction={tx}
                        onClick={setSelectedTx}
                      />
                    ))}
                  </div>
                  {catTotalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <button
                        onClick={() => handleCatPageChange(catPage - 1)}
                        disabled={catPage <= 1}
                        className="w-10 h-10 flex items-center justify-center rounded-lg border border-neutral-light text-neutral-dark hover:bg-brand-primary-lightest disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                          <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <span className="text-sm text-neutral-medium px-2">{catPage} / {catTotalPages}</span>
                      <button
                        onClick={() => handleCatPageChange(catPage + 1)}
                        disabled={catPage >= catTotalPages}
                        className="w-10 h-10 flex items-center justify-center rounded-lg border border-neutral-light text-neutral-dark hover:bg-brand-primary-lightest disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                          <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Category list */}
          {summary && viewMode === "category" && !selectedCategory && (
            <div className="mb-8">
              <CategoryList
                categories={summary.by_category}
                totalSpent={summary.total_spent}
                onSelect={handleSelectCategory}
              />
            </div>
          )}

          {/* All transactions */}
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
                        <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
                        <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

      {selectedTx && (
        <TransactionDetailModal
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
          onUpdate={(id, updates) => {
            updateTransaction(id, updates);
            // Also update in category view if active
            setCatTransactions((prev) =>
              prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
            );
          }}
          onDelete={(id) => {
            removeTransaction(id);
            setCatTransactions((prev) => prev.filter((t) => t.id !== id));
          }}
        />
      )}
    </div>
  );
}
