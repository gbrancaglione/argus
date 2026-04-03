type Preset = {
  label: string;
  from: string;
  to: string;
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
    { label: "Este ano", from: fmt(firstOfMonth(y, 0)), to: fmt(lastOfMonth(y, m)) },
  ];
}

type PeriodPresetBarProps = {
  activeFrom: string;
  activeTo: string;
  onSelect: (from: string, to: string) => void;
};

export default function PeriodPresetBar({ activeFrom, activeTo, onSelect }: PeriodPresetBarProps) {
  const presets = buildPresets();

  return (
    <div className="flex flex-wrap gap-2">
      {presets.map((preset) => {
        const isActive = preset.from === activeFrom && preset.to === activeTo;
        return (
          <button
            key={preset.label}
            onClick={() => onSelect(preset.from, preset.to)}
            className={`px-3 py-1.5 text-sm rounded-lg border cursor-pointer transition-colors ${
              isActive
                ? "bg-brand-primary text-neutral-white border-brand-primary font-bold"
                : "bg-neutral-white text-neutral-darkest border-neutral-light hover:bg-brand-primary-lightest"
            }`}
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}
