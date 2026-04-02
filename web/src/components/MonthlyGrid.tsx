import type { PeriodSummary } from "../types/spending";
import { formatBRL, formatMonthBR } from "../utils/format";

type MonthlyGridProps = {
  monthly: Record<string, PeriodSummary>;
  currentMonth: string;
};

export default function MonthlyGrid({ monthly, currentMonth }: MonthlyGridProps) {
  const months = Object.entries(monthly);

  if (months.length === 0) {
    return <p className="text-neutral-medium text-sm py-8 text-center">Nenhum dado encontrado para o periodo.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {months.map(([month, data]) => (
        <div
          key={month}
          className={`bg-neutral-white rounded-lg shadow-level-1 p-5 ${
            month === currentMonth ? "border-2 border-brand-primary" : "border border-neutral-lightest"
          }`}
        >
          <p className="text-sm text-neutral-medium capitalize">{formatMonthBR(month)}</p>
          <p className="font-heading text-xl font-black text-status-error mt-1">{formatBRL(data.spent)}</p>
          <p className="text-xs text-neutral-medium mt-1">{data.count} transações</p>
        </div>
      ))}
    </div>
  );
}
