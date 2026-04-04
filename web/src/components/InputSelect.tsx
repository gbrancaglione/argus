import { useState, useRef, useEffect } from "react";

type Option = {
  value: string;
  label: string;
};

type InputSelectProps = {
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  optional?: boolean;
  onCreateNew?: (name: string) => Promise<Option>;
  createNewLabel?: string;
  dropUp?: boolean;
};

export default function InputSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Selecione...",
  optional,
  onCreateNew,
  createNewLabel = "Criar nova categoria...",
  dropUp,
}: InputSelectProps) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setCreating(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (creating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [creating]);

  function handleSelect(optionValue: string) {
    onChange(optionValue);
    setOpen(false);
  }

  async function handleCreate() {
    if (!onCreateNew || !newName.trim() || saving) return;
    setSaving(true);
    try {
      const created = await onCreateNew(newName.trim());
      onChange(created.value);
      setCreating(false);
      setNewName("");
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div ref={containerRef} className="w-full relative">
      {/* Label row */}
      <div className="flex justify-between pb-1">
        <span className="text-base leading-[18.75px] text-neutral-darkest">
          {label}
        </span>
        {optional && (
          <span className="text-sm leading-[16.41px] text-neutral-dark">
            Opcional
          </span>
        )}
      </div>

      {/* Select trigger */}
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          setCreating(false);
        }}
        className={`w-full flex items-center justify-between gap-2 rounded-lg border ${
          open ? "border-2 border-brand-primary" : "border-neutral-light"
        } bg-neutral-white h-12 px-4 cursor-pointer`}
      >
        <span
          className={`text-base leading-[18.75px] truncate ${
            selected ? "text-neutral-darkest" : "text-neutral-light"
          }`}
        >
          {selected ? selected.label : placeholder}
        </span>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          className="flex-shrink-0"
        >
          <path
            d={
              open
                ? "M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"
                : "M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"
            }
            fill="var(--color-brand-primary)"
          />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className={`absolute z-50 w-full bg-neutral-white rounded-lg shadow-level-3 p-4 max-h-64 overflow-y-auto ${dropUp ? "bottom-full mb-1" : "mt-1"}`}>
          {/* Options */}
          <div className="flex flex-col gap-1">
            {/* Empty option */}
            <button
              type="button"
              onClick={() => handleSelect("")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                value === ""
                  ? "bg-brand-primary-lightest text-brand-primary-dark font-bold"
                  : "text-neutral-dark hover:bg-neutral-bg"
              }`}
            >
              Sem categoria
            </button>

            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                  option.value === value
                    ? "bg-brand-primary-lightest text-brand-primary-dark font-bold"
                    : "text-neutral-darkest hover:bg-neutral-bg"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Create new */}
          {onCreateNew && (
            <div className="border-t border-neutral-lightest mt-2 pt-2">
              {creating ? (
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreate();
                      if (e.key === "Escape") setCreating(false);
                    }}
                    placeholder="Nome da categoria"
                    className="flex-1 border border-neutral-light rounded-lg px-3 py-2 text-sm text-neutral-darkest bg-neutral-white focus:border-brand-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={saving || !newName.trim()}
                    className="px-3 py-2 bg-brand-primary text-neutral-white rounded-lg text-sm font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "..." : "Criar"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-brand-primary font-bold cursor-pointer hover:bg-brand-primary-lightest transition-colors"
                >
                  + {createNewLabel}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
