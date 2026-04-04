import { formatBRL } from "../utils/format";
import type { PeriodSummary } from "../types/spending";

const MONTH_NAMES: Record<string, string> = {
  "01": "Jan", "02": "Fev", "03": "Mar", "04": "Abr",
  "05": "Mai", "06": "Jun", "07": "Jul", "08": "Ago",
  "09": "Set", "10": "Out", "11": "Nov", "12": "Dez",
};

function formatPeriodLabel(key: string): string {
  // Handle YYYY-MM
  if (/^\d{4}-\d{2}$/.test(key)) {
    const [y, m] = key.split("-");
    return `${MONTH_NAMES[m] ?? m} ${y}`;
  }
  // Handle YYYY-Wnn
  if (/^\d{4}-W\d{2}$/.test(key)) {
    return key.replace("-", " ");
  }
  // Handle YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
    const [, m, d] = key.split("-");
    return `${d}/${m}`;
  }
  return key;
}

type MonthOverMonthTableProps = {
  data: Record<string, PeriodSummary>;
  currentPeriod?: string;
};

export default function MonthOverMonthTable({ data, currentPeriod }: MonthOverMonthTableProps) {
  const keys = Object.keys(data).sort();

  if (keys.length === 0) {
    return (
      <p className="text-neutral-medium text-sm py-4 text-center">
        Sem dados para o período.
      </p>
    );
  }

  const rows = keys.map((key, i) => {
    const current = data[key].spent;
    const previous = i > 0 ? data[keys[i - 1]].spent : null;
    const delta = previous !== null ? current - previous : null;
    const deltaPct = previous !== null && previous > 0 ? ((delta! / previous) * 100) : null;

    return { key, spent: current, count: data[key].count, delta, deltaPct };
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-lightest">
            <th className="text-left text-xs text-neutral-medium font-bold py-2 pr-3">Período</th>
            <th className="text-right text-xs text-neutral-medium font-bold py-2 px-3">Total</th>
            <th className="text-right text-xs text-neutral-medium font-bold py-2 pl-3">Variação</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b border-neutral-lightest last:border-0">
              <td className="py-2 pr-3 text-neutral-darkest font-bold">
                {formatPeriodLabel(row.key)}
                {currentPeriod && row.key === currentPeriod && (
                  <span className="ml-1.5 text-[10px] font-bold text-neutral-dark bg-neutral-lightest px-1.5 py-0.5 rounded-full align-middle">
                    atual
                  </span>
                )}
                {currentPeriod && row.key > currentPeriod && (
                  <span className="ml-1.5 text-[10px] font-bold text-brand-primary bg-brand-primary-lightest px-1.5 py-0.5 rounded-full align-middle">
                    projeção
                  </span>
                )}
              </td>
              <td className="py-2 px-3 text-right text-neutral-darkest">
                {formatBRL(row.spent)}
              </td>
              <td className="py-2 pl-3 text-right">
                {currentPeriod && row.key > currentPeriod ? (
                  <span className="text-neutral-medium">—</span>
                ) : row.delta !== null ? (
                  <span className={`font-bold ${row.delta > 0 ? "text-status-error" : row.delta < 0 ? "text-status-success" : "text-neutral-medium"}`}>
                    {row.delta > 0 ? "+" : ""}
                    {row.deltaPct !== null ? `${row.deltaPct.toFixed(1)}%` : "—"}
                  </span>
                ) : (
                  <span className="text-neutral-medium">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
