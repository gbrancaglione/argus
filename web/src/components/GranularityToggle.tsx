type Granularity = "month" | "week" | "day";

const OPTIONS: { value: Granularity; label: string }[] = [
  { value: "month", label: "Mês" },
  { value: "week", label: "Semana" },
  { value: "day", label: "Dia" },
];

type GranularityToggleProps = {
  value: Granularity;
  onChange: (granularity: Granularity) => void;
};

export default function GranularityToggle({ value, onChange }: GranularityToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-neutral-light overflow-hidden">
      {OPTIONS.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1 text-xs font-bold cursor-pointer transition-colors ${
              isActive
                ? "bg-brand-primary text-neutral-white"
                : "bg-neutral-white text-neutral-dark hover:bg-brand-primary-lightest"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
