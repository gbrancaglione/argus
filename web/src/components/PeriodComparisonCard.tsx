type PeriodComparisonCardProps = {
  label: string;
  currentValue: string;
  currentRaw: number;
  previousRaw: number;
  invertColor?: boolean; // true = decrease is good (spending)
};

export default function PeriodComparisonCard({
  label,
  currentValue,
  currentRaw,
  previousRaw,
  invertColor = true,
}: PeriodComparisonCardProps) {
  const diff = previousRaw > 0
    ? ((currentRaw - previousRaw) / previousRaw) * 100
    : 0;
  const increased = diff > 0;
  const isGood = invertColor ? !increased : increased;
  const hasDiff = previousRaw > 0 && diff !== 0;

  return (
    <div className="bg-neutral-white rounded-lg shadow-level-1 px-5 py-4">
      <p className="text-xs text-neutral-medium mb-1">{label}</p>
      <p className="font-heading font-black text-2xl text-neutral-darkest">
        {currentValue}
      </p>
      {hasDiff && (
        <div className="flex items-center gap-1 mt-1">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            {increased ? (
              <path d="M6 2L10 8H2L6 2Z" fill={isGood ? "#268041" : "#E94A4A"} />
            ) : (
              <path d="M6 10L2 4H10L6 10Z" fill={isGood ? "#268041" : "#E94A4A"} />
            )}
          </svg>
          <span
            className={`text-xs font-bold ${isGood ? "text-status-success" : "text-status-error"}`}
          >
            {Math.abs(diff).toFixed(1)}%
          </span>
          <span className="text-xs text-neutral-medium">vs anterior</span>
        </div>
      )}
    </div>
  );
}
