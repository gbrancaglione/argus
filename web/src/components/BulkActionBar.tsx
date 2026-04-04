import { useState } from "react";
import type { Label } from "../types/spending";
import Button from "./Button";
import InputSelect from "./InputSelect";

type BulkActionBarProps = {
  selectedCount: number;
  onClearSelection: () => void;
  onApply: (labelId: number | null) => Promise<void>;
  labels: Label[];
  onCreateLabel: (name: string) => Promise<Label>;
};

export default function BulkActionBar({
  selectedCount,
  onClearSelection,
  onApply,
  labels,
  onCreateLabel,
}: BulkActionBarProps) {
  const [labelId, setLabelId] = useState("");
  const [applying, setApplying] = useState(false);

  if (selectedCount === 0) return null;

  const labelOptions = labels.map((l) => ({
    value: String(l.id),
    label: l.name,
  }));

  async function handleCreateLabel(name: string) {
    const label = await onCreateLabel(name);
    return { value: String(label.id), label: label.name };
  }

  async function handleApply() {
    if (applying) return;
    setApplying(true);
    try {
      await onApply(labelId === "" ? null : Number(labelId));
      setLabelId("");
    } finally {
      setApplying(false);
    }
  }

  return (
    <>
      {/* Spacer to prevent content from being hidden behind the bar */}
      <div className="h-20" />
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-neutral-white border-t border-neutral-light shadow-level-3">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-neutral-darkest">
              {selectedCount} selecionada{selectedCount !== 1 ? "s" : ""}
            </span>
            <Button variant="tertiary" size="small" onClick={onClearSelection}>
              Limpar
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-56">
              <InputSelect
                label=""
                options={labelOptions}
                value={labelId}
                onChange={setLabelId}
                placeholder="Selecionar categoria"
                onCreateNew={handleCreateLabel}
                dropUp
              />
            </div>
            <Button
              variant="primary"
              size="small"
              onClick={handleApply}
              disabled={applying}
            >
              {applying ? "Aplicando..." : "Aplicar"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
