import type { ReactElement } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { formatBRL } from "../utils/format";

const CATEGORY_COLORS = [
  "#59399E", "#A6CD15", "#3DE4F5", "#E94A4A",
  "#F1AF0F", "#268041", "#AB9DE8", "#D9F363",
  "#1A3D47", "#763D11", "#7C2020", "#3A2666",
  "#50660C", "#175028", "#33400F", "#BBB8CC",
];

const MONTH_NAMES: Record<string, string> = {
  "01": "Jan", "02": "Fev", "03": "Mar", "04": "Abr",
  "05": "Mai", "06": "Jun", "07": "Jul", "08": "Ago",
  "09": "Set", "10": "Out", "11": "Nov", "12": "Dez",
};

function formatPeriodKey(key: string) {
  // YYYY-MM → "Jan", "Fev", etc.
  if (/^\d{4}-\d{2}$/.test(key)) {
    const [, m] = key.split("-");
    return MONTH_NAMES[m] ?? m;
  }
  // YYYY-Wnn → "W14"
  if (/^\d{4}-W\d{2}$/.test(key)) {
    return key.split("-")[1];
  }
  // YYYY-MM-DD → "15/03"
  if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
    const [, m, d] = key.split("-");
    return `${d}/${m}`;
  }
  return key;
}

// Keep backward compat alias
function formatMonth(yyyyMm: string) {
  return formatPeriodKey(yyyyMm);
}

type SpendingTrendChartProps = {
  months: string[];
  categoryTrend: Record<string, Record<string, number>>;
  monthlyTotals: Record<string, number>;
  selectedMonth?: string | null;
  onMonthClick?: (month: string) => void;
};

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}): ReactElement | null {
  if (!active || !payload || !label) return null;

  const total = payload.reduce((s, p) => s + p.value, 0);

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 8,
        border: "1px solid #E9E9F2",
        boxShadow: "0px 4px 12px #9190a014",
        padding: "10px 14px",
        fontSize: 12,
      }}
    >
      <p style={{ fontWeight: 700, marginBottom: 6, color: "#201F26" }}>
        {formatMonth(String(label))} — {formatBRL(total)}
      </p>
      {[...payload].filter((entry) => entry.value > 0).sort((a, b) => b.value - a.value).map((entry) => {
        const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : "0.0";
        return (
          <div
            key={entry.name}
            style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: entry.color,
                flexShrink: 0,
              }}
            />
            <span style={{ color: "#444152", flex: 1 }}>{entry.name}</span>
            <span style={{ color: "#201F26", fontWeight: 600 }}>
              {formatBRL(entry.value)}
            </span>
            <span style={{ color: "#79778C" }}>({pct}%)</span>
          </div>
        );
      })}
    </div>
  );
}

export default function SpendingTrendChart({
  months,
  categoryTrend,
  monthlyTotals,
  selectedMonth,
  onMonthClick,
}: SpendingTrendChartProps) {
  if (months.length === 0) {
    return (
      <p className="text-neutral-medium text-sm py-8 text-center">
        Sem dados para o periodo selecionado.
      </p>
    );
  }

  // Sort categories by total spend DESC, take top 8, rest goes to "Outros"
  const catTotals = Object.entries(categoryTrend).map(([cat, byMonth]) => ({
    cat,
    total: Object.values(byMonth).reduce((s, v) => s + v, 0),
  }));
  catTotals.sort((a, b) => b.total - a.total);

  const topCats = catTotals.slice(0, 10).map((c) => c.cat);
  const hasOthers = catTotals.length > 10;

  const chartData = months.map((month) => {
    const point: Record<string, string | number> = { month };
    let topSum = 0;
    for (const cat of topCats) {
      const displayName = cat === "null" || cat == null ? "Sem categoria" : cat;
      const val = categoryTrend[cat]?.[month] ?? 0;
      point[displayName] = val;
      topSum += val;
    }
    if (hasOthers) {
      point["Outros"] = (monthlyTotals[month] ?? 0) - topSum;
    }
    return point;
  });

  const displayCats = topCats.map((c) =>
    c === "null" || c == null ? "Sem categoria" : c
  );
  if (hasOthers) displayCats.push("Outros");

  return (
    <ResponsiveContainer width="100%" height={340}>
      <BarChart
        data={chartData}
        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E9E9F2" />
        <XAxis
          dataKey="month"
          tickFormatter={(m: string) => {
            const label = formatMonth(m);
            return selectedMonth === m ? `● ${label}` : label;
          }}
          tick={{ fontSize: 12, fill: "#79778C" }}
          axisLine={{ stroke: "#E9E9F2" }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => formatBRL(v)}
          tick={{ fontSize: 11, fill: "#79778C" }}
          axisLine={false}
          tickLine={false}
          width={90}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        {displayCats.map((cat, i) => (
          <Bar
            key={cat}
            dataKey={cat}
            stackId="spending"
            fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
            radius={i === displayCats.length - 1 ? [4, 4, 0, 0] : undefined}
            cursor={onMonthClick ? "pointer" : undefined}
            onClick={(barData) => {
              const d = barData as unknown as { month?: string };
              if (onMonthClick && d?.month) {
                onMonthClick(String(d.month));
              }
            }}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
