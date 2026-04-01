import { useState, useRef, useEffect } from "react";

type Preset = {
  label: string;
  from: string;
  to: string;
};

type DateRangePickerProps = {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
};

function buildPresets(): Preset[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const firstOfMonth = (year: number, month: number) => new Date(year, month, 1);
  const lastOfMonth = (year: number, month: number) => new Date(year, month + 1, 0);

  return [
    { label: "Este mês", from: fmt(firstOfMonth(y, m)), to: fmt(lastOfMonth(y, m)) },
    { label: "Mês passado", from: fmt(firstOfMonth(y, m - 1)), to: fmt(lastOfMonth(y, m - 1)) },
    { label: "Últimos 3 meses", from: fmt(firstOfMonth(y, m - 2)), to: fmt(lastOfMonth(y, m)) },
    { label: "Últimos 6 meses", from: fmt(firstOfMonth(y, m - 5)), to: fmt(lastOfMonth(y, m)) },
    { label: "Últimos 12 meses", from: fmt(firstOfMonth(y, m - 11)), to: fmt(lastOfMonth(y, m)) },
  ];
}

function formatRangeLabel(from: string, to: string): string {
  const f = new Date(from + "T12:00:00");
  const t = new Date(to + "T12:00:00");
  const fmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
  return `${fmt.format(f)} — ${fmt.format(t)}`;
}

export default function DateRangePicker({ from, to, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(from);
  const [customTo, setCustomTo] = useState(to);
  const ref = useRef<HTMLDivElement>(null);
  const presets = buildPresets();

  const handleOpen = () => {
    setCustomFrom(from);
    setCustomTo(to);
    setOpen(!open);
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activePreset = presets.find((p) => p.from === from && p.to === to);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 border border-neutral-light rounded-lg px-3 py-2 text-sm text-neutral-darkest bg-neutral-white hover:bg-brand-primary-lightest cursor-pointer"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M1.5 6H14.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5 1V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M11 1V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span>{activePreset ? activePreset.label : formatRangeLabel(from, to)}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 bg-neutral-white rounded-lg shadow-level-3 border border-neutral-lightest z-10 w-72">
          {/* Presets */}
          <div className="p-2 border-b border-neutral-lightest">
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  onChange(preset.from, preset.to);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm rounded-md cursor-pointer transition-colors ${
                  preset.from === from && preset.to === to
                    ? "bg-brand-primary-lightest text-brand-primary font-bold"
                    : "text-neutral-darkest hover:bg-neutral-bg"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Custom range */}
          <div className="p-3">
            <p className="text-xs text-neutral-medium font-bold mb-2">Personalizado</p>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="border border-neutral-light rounded-lg px-2 py-1.5 text-sm text-neutral-darkest flex-1 min-w-0"
              />
              <span className="text-neutral-medium text-xs">até</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="border border-neutral-light rounded-lg px-2 py-1.5 text-sm text-neutral-darkest flex-1 min-w-0"
              />
            </div>
            <button
              onClick={() => {
                if (customFrom && customTo) {
                  onChange(customFrom, customTo);
                  setOpen(false);
                }
              }}
              className="w-full bg-brand-primary text-neutral-white text-sm font-bold rounded-lg py-2 hover:bg-brand-primary-dark cursor-pointer"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
