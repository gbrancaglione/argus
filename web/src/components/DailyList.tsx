import type { PeriodSummary } from "../types/spending";
import { formatBRL, formatDateBR } from "../utils/format";

type DailyListProps = {
  daily: Record<string, PeriodSummary>;
};

export default function DailyList({ daily }: DailyListProps) {
  const days = Object.entries(daily).sort(([a], [b]) => b.localeCompare(a));

  if (days.length === 0) {
    return <p className="text-neutral-medium text-sm py-8 text-center">Nenhum dado encontrado para o periodo.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {days.map(([day, data]) => (
        <div
          key={day}
          className="flex items-center justify-between bg-neutral-white rounded-lg shadow-level-1 px-5 py-4"
        >
          <div>
            <p className="text-sm font-bold text-neutral-darkest capitalize">{formatDateBR(day)}</p>
            <p className="text-xs text-neutral-medium">{data.count} transações</p>
          </div>
          <span className="font-heading font-black text-status-error">{formatBRL(data.spent)}</span>
        </div>
      ))}
    </div>
  );
}
