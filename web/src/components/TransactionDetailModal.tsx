import { useState, useEffect, useRef } from "react";
import type { LocalTransaction, Label } from "../types/spending";
import {
  updateTransaction,
  deleteTransaction,
  fetchLabels,
  createLabel,
} from "../api/spending";
import { formatBRL } from "../utils/format";
import Button from "./Button";
import InputSelect from "./InputSelect";

type TransactionDetailModalProps = {
  transaction: LocalTransaction;
  onClose: () => void;
  onUpdate: (id: number, updates: Partial<LocalTransaction>) => void;
  onDelete: (id: number) => void;
  labels?: Label[];
  onCreateLabel?: (name: string) => Promise<Label>;
};

export default function TransactionDetailModal({
  transaction,
  onClose,
  onUpdate,
  onDelete,
  labels: externalLabels,
  onCreateLabel: externalCreateLabel,
}: TransactionDetailModalProps) {
  const [description, setDescription] = useState(transaction.description ?? "");
  const [labelId, setLabelId] = useState<string>(
    transaction.label_id != null ? String(transaction.label_id) : ""
  );
  const [labels, setLabels] = useState<Label[]>(externalLabels ?? []);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  const isExpense = transaction.amount > 0;
  const isForeign = transaction.currency_code !== "BRL";
  const categoryEdited = transaction.category_edited;
  const hasChanges =
    description !== (transaction.description ?? "") ||
    labelId !== (transaction.label_id != null ? String(transaction.label_id) : "");

  useEffect(() => {
    if (!externalLabels) {
      fetchLabels().then(setLabels);
    }
  }, [externalLabels]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === backdropRef.current) onClose();
  }

  async function handleCreateLabel(name: string) {
    const label = externalCreateLabel
      ? await externalCreateLabel(name)
      : await createLabel(name);
    setLabels((prev) => [...prev, label].sort((a, b) => a.name.localeCompare(b.name)));
    return { value: String(label.id), label: label.name };
  }

  async function handleSave() {
    if (saving || !hasChanges) return;
    setSaving(true);
    try {
      const updates: { label_id?: number | null; description?: string } = {};
      const currentLabelId = transaction.label_id != null ? String(transaction.label_id) : "";
      if (labelId !== currentLabelId) {
        updates.label_id = labelId === "" ? null : Number(labelId);
      }
      if (description !== (transaction.description ?? ""))
        updates.description = description;

      const result = await updateTransaction(transaction.id, updates);
      onUpdate(transaction.id, result);
      onClose();
    } catch {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteTransaction(transaction.id);
      onDelete(transaction.id);
      onClose();
    } catch {
      setDeleting(false);
    }
  }

  const labelOptions = labels.map((l) => ({
    value: String(l.id),
    label: l.name,
  }));

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div className="bg-neutral-white rounded-xl shadow-level-3 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-neutral-lightest">
          <h3 className="font-heading font-black text-lg text-neutral-darkest">
            Detalhes da transação
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-bg cursor-pointer text-neutral-medium"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 4L12 12M12 4L4 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Amount */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-medium">Valor</span>
            <div className="text-right">
              <span
                className={`font-heading text-xl font-black ${
                  isExpense ? "text-status-error" : "text-status-success"
                }`}
              >
                {isExpense ? "- " : "+ "}
                {isForeign && transaction.amount_brl != null
                  ? formatBRL(Math.abs(transaction.amount_brl))
                  : formatBRL(Math.abs(transaction.amount))}
              </span>
              {isForeign && (
                <div className="text-xs text-neutral-medium">
                  {Math.abs(transaction.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} {transaction.currency_code}
                  {transaction.amount_brl != null && (
                    <> = {formatBRL(Math.abs(transaction.amount_brl))}</>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-medium">Data</span>
            <span className="text-sm text-neutral-darkest">
              {new Intl.DateTimeFormat("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              }).format(new Date(transaction.date + "T12:00:00"))}
            </span>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-medium">Status</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-neutral-lightest text-neutral-dark">
              {transaction.status}
            </span>
          </div>

          {/* Description — editable */}
          <div>
            <label className="text-sm text-neutral-medium block mb-1">
              Descrição
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-neutral-light rounded-lg px-3 py-2 text-sm text-neutral-darkest bg-neutral-white focus:border-brand-primary focus:outline-none"
            />
          </div>

          {/* Category — select */}
          <div>
            <InputSelect
              label="Categoria"
              options={labelOptions}
              value={labelId}
              onChange={setLabelId}
              placeholder="Sem categoria"
              onCreateNew={handleCreateLabel}
            />
            {categoryEdited && (
              <span className="text-xs text-status-warning-dark mt-1 block">
                (original: {transaction.original_category})
              </span>
            )}
          </div>

          {/* External ID */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-medium">ID externo</span>
            <span className="text-xs text-neutral-light font-mono truncate ml-4 max-w-[200px]">
              {transaction.external_id}
            </span>
          </div>
        </div>

        {/* Footer — actions */}
        <div className="px-6 pb-6 pt-2 flex items-center justify-between border-t border-neutral-lightest">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-status-error">Tem certeza?</span>
              <Button
                variant="primary"
                size="small"
                onClick={handleDelete}
                disabled={deleting}
                style={{ backgroundColor: "var(--color-status-error)" }}
              >
                {deleting ? "Excluindo..." : "Sim, excluir"}
              </Button>
              <Button
                variant="tertiary"
                size="small"
                onClick={() => setConfirmDelete(false)}
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-sm text-status-error hover:text-status-error-dark cursor-pointer font-bold"
            >
              Excluir
            </button>
          )}

          <div className="flex items-center gap-2">
            <Button variant="tertiary" size="small" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="small"
              onClick={handleSave}
              disabled={saving || !hasChanges}
            >
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
