import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useSyncReview } from "../hooks/useSyncReview";
import { useLabels } from "../hooks/useLabels";
import { useSelection } from "../hooks/useSelection";
import { bulkUpdateTransactions, approveSync, rejectSync } from "../api/spending";
import { formatDateBR } from "../utils/format";
import type { LocalTransaction } from "../types/spending";
import Button from "../components/Button";
import TabBar from "../components/TabBar";
import CreditCardTransactionRow from "../components/CreditCardTransactionRow";
import TransactionDetailModal from "../components/TransactionDetailModal";
import BulkActionBar from "../components/BulkActionBar";

const ACTION_TABS = [
  { key: "all", label: "Todas" },
  { key: "created", label: "Criadas" },
  { key: "updated", label: "Atualizadas" },
];

export default function SyncReviewPage() {
  const { syncId } = useParams<{ syncId: string }>();
  const id = Number(syncId);

  const {
    syncLog,
    setSyncLog,
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
    updateTransaction,
    removeTransaction,
  } = useSyncReview(id);

  const { labels, loadLabels, addLabel } = useLabels();
  const selection = useSelection(transactions.map((t) => t.id));
  const [selectedTx, setSelectedTx] = useState<LocalTransaction | null>(null);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);

  useEffect(() => {
    init();
    loadLabels();
  }, [init, loadLabels]);

  // Reset selection on filter/page change
  useEffect(() => {
    selection.clearAll();
  }, [actionFilter, page, selection.clearAll]);

  function handleTabChange(key: string) {
    changeFilter(key as "all" | "created" | "updated");
  }

  async function handleBulkApply(labelId: number | null) {
    const ids = [...selection.selectedIds];
    const updated = await bulkUpdateTransactions({ ids, label_id: labelId });
    for (const tx of updated) {
      updateTransaction(tx.id, tx);
    }
    selection.clearAll();
  }

  async function handleApprove() {
    if (approving) return;
    setApproving(true);
    try {
      const updated = await approveSync(id);
      setSyncLog(updated);
    } finally {
      setApproving(false);
    }
  }

  async function handleReject() {
    if (rejecting) return;
    setRejecting(true);
    try {
      const updated = await rejectSync(id);
      setSyncLog(updated);
    } finally {
      setRejecting(false);
      setConfirmReject(false);
    }
  }

  const isPending = syncLog?.approval_status === "pending";
  const isApproved = syncLog?.approval_status === "approved";
  const isRejected = syncLog?.approval_status === "rejected";

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/sync"
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-light text-neutral-dark hover:bg-brand-primary-lightest"
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
            <path
              d="M12.5 15L7.5 10L12.5 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <h2 className="font-heading text-xl font-black text-neutral-darkest">
          Revisão da sincronização
        </h2>
      </div>

      {error && (
        <div className="bg-status-error-light text-status-error-dark rounded-lg px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Pending approval banner */}
      {isPending && (
        <div className="bg-status-warning-light rounded-lg px-5 py-4 mb-6 flex items-center justify-between">
          <span className="text-sm text-status-warning-dark font-bold">
            Esta sincronização está pendente de aprovação. As transações não são visíveis até que você aprove.
          </span>
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            {confirmReject ? (
              <>
                <span className="text-sm text-status-error font-bold">Tem certeza?</span>
                <Button variant="primary" size="small" onClick={handleReject} disabled={rejecting} style={{ backgroundColor: "var(--color-status-error)" }}>
                  {rejecting ? "Rejeitando..." : "Sim, rejeitar"}
                </Button>
                <Button variant="tertiary" size="small" onClick={() => setConfirmReject(false)}>
                  Cancelar
                </Button>
              </>
            ) : (
              <>
                <Button variant="tertiary" size="small" onClick={() => setConfirmReject(true)}>
                  Rejeitar
                </Button>
                <Button variant="primary" size="small" onClick={handleApprove} disabled={approving}>
                  {approving ? "Aprovando..." : "Aprovar"}
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Approved badge */}
      {isApproved && (
        <div className="bg-status-success-light rounded-lg px-5 py-3 mb-6">
          <span className="text-sm text-status-success-dark font-bold">Sincronização aprovada</span>
        </div>
      )}

      {/* Rejected badge */}
      {isRejected && (
        <div className="bg-status-error-light rounded-lg px-5 py-3 mb-6">
          <span className="text-sm text-status-error-dark font-bold">Sincronização rejeitada — transações foram excluídas</span>
        </div>
      )}

      {/* Sync metadata */}
      {syncLog && (
        <div className="bg-neutral-white rounded-lg shadow-level-2 p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm text-neutral-medium">
              {formatDateBR(syncLog.from_date)} — {formatDateBR(syncLog.to_date)}
            </span>
          </div>
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-neutral-medium">Criadas: </span>
              <span className="font-bold text-neutral-darkest">
                {syncLog.transactions_created}
              </span>
            </div>
            <div>
              <span className="text-neutral-medium">Atualizadas: </span>
              <span className="font-bold text-neutral-darkest">
                {syncLog.transactions_updated}
              </span>
            </div>
            <div>
              <span className="text-neutral-medium">Ignoradas: </span>
              <span className="font-bold text-neutral-darkest">
                {syncLog.transactions_skipped}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <TabBar
          tabs={ACTION_TABS}
          activeTab={actionFilter}
          onChange={handleTabChange}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-brand-primary-lightest border-t-brand-primary rounded-full animate-spin" />
        </div>
      ) : transactions.length === 0 ? (
        <p className="text-neutral-medium text-sm py-8 text-center">
          Nenhuma transação encontrada neste filtro.
        </p>
      ) : (
        <div>
          {/* Select all */}
          <div className="flex items-center gap-2 mb-3">
            <div
              className="flex items-center cursor-pointer"
              onClick={() =>
                selection.isAllSelected
                  ? selection.clearAll()
                  : selection.selectAll()
              }
            >
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  selection.isAllSelected
                    ? "bg-brand-primary border-brand-primary"
                    : "border-neutral-light hover:border-brand-primary"
                }`}
              >
                {selection.isAllSelected && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2.5 6L5 8.5L9.5 3.5"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <span className="ml-2 text-sm text-neutral-medium">
                Selecionar todas ({total})
              </span>
            </div>
          </div>

          <div className="bg-neutral-white rounded-lg shadow-level-1 px-5">
            {transactions.map((tx) => (
              <CreditCardTransactionRow
                key={tx.id}
                transaction={tx}
                onClick={setSelectedTx}
                selectable
                selected={selection.isSelected(tx.id)}
                onToggleSelect={selection.toggle}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => changePage(page - 1)}
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
                onClick={() => changePage(page + 1)}
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

      {/* Transaction detail modal */}
      {selectedTx && (
        <TransactionDetailModal
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
          onUpdate={updateTransaction}
          onDelete={removeTransaction}
          labels={labels}
          onCreateLabel={addLabel}
        />
      )}

      {/* Bulk action bar */}
      <BulkActionBar
        selectedCount={selection.count}
        onClearSelection={selection.clearAll}
        onApply={handleBulkApply}
        labels={labels}
        onCreateLabel={addLabel}
      />
    </div>
  );
}
