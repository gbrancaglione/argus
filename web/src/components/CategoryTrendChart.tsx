import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { formatBRL } from "../utils/format";

const CATEGORY_COLORS = [
  "#59399E",
  "#A6CD15",
  "#3DE4F5",
  "#E94A4A",
  "#F1AF0F",
  "#268041",
  "#AB9DE8",
  "#D9F363",
  "#1A3D47",
  "#763D11",
  "#7C2020",
  "#3A2666",
];

const MONTH_NAMES: Record<string, string> = {
  "01": "Jan", "02": "Fev", "03": "Mar", "04": "Abr",
  "05": "Mai", "06": "Jun", "07": "Jul", "08": "Ago",
  "09": "Set", "10": "Out", "11": "Nov", "12": "Dez",
};

function formatPeriodKey(key: string) {
  if (/^\d{4}-\d{2}$/.test(key)) {
    const [, m] = key.split("-");
    return MONTH_NAMES[m] ?? m;
  }
  if (/^\d{4}-W\d{2}$/.test(key)) {
    return key.split("-")[1];
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
    const [, m, d] = key.split("-");
    return `${d}/${m}`;
  }
  return key;
}

type CategoryTrendChartProps = {
  data: Record<string, Record<string, number>>;
  months: string[];
};

export default function CategoryTrendChart({ data, months }: CategoryTrendChartProps) {
  // Sort categories by total spend descending
  const sortedCategories = useMemo(() => {
    return Object.entries(data)
      .map(([cat, byPeriod]) => ({
        name: cat,
        displayName: cat === "null" || cat == null ? "Sem categoria" : cat,
        total: Object.values(byPeriod).reduce((s, v) => s + v, 0),
      }))
      .sort((a, b) => b.total - a.total);
  }, [data]);

  // Default: top 5 selected
  const [selected, setSelected] = useState<Set<string>>(() =>
    new Set(sortedCategories.slice(0, 5).map((c) => c.name))
  );

  function toggleCategory(cat: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(sortedCategories.map((c) => c.name)));
  }

  function selectNone() {
    setSelected(new Set());
  }

  const activeCategories = sortedCategories.filter((c) => selected.has(c.name));

  if (sortedCategories.length === 0 || months.length === 0) {
    return (
      <p className="text-neutral-medium text-sm py-8 text-center">
        Sem dados para o período selecionado.
      </p>
    );
  }

  const chartData = months.map((month) => {
    const point: Record<string, string | number> = { month };
    for (const cat of activeCategories) {
      point[cat.displayName] = data[cat.name]?.[month] ?? 0;
    }
    return point;
  });

  return (
    <div>
      {/* Category selector */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button
          onClick={selectAll}
          className="text-xs text-brand-primary hover:underline cursor-pointer font-bold"
        >
          Todas
        </button>
        <span className="text-neutral-light">|</span>
        <button
          onClick={selectNone}
          className="text-xs text-brand-primary hover:underline cursor-pointer font-bold"
        >
          Nenhuma
        </button>
        <span className="text-neutral-light ml-1">|</span>
        {sortedCategories.map((cat, i) => {
          const isActive = selected.has(cat.name);
          const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
          return (
            <button
              key={cat.name}
              onClick={() => toggleCategory(cat.name)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs cursor-pointer transition-all border ${
                isActive
                  ? "font-bold border-transparent"
                  : "border-neutral-light text-neutral-medium bg-neutral-white hover:bg-neutral-bg"
              }`}
              style={
                isActive
                  ? { backgroundColor: `${color}18`, color, borderColor: `${color}40` }
                  : undefined
              }
            >
              {isActive && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
              )}
              {cat.displayName}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      {activeCategories.length === 0 ? (
        <p className="text-neutral-medium text-sm py-8 text-center">
          Selecione ao menos uma categoria.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E9E9F2" />
            <XAxis
              dataKey="month"
              tickFormatter={formatPeriodKey}
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
            <Tooltip
              formatter={(value) => [formatBRL(Number(value)), ""]}
              labelFormatter={(label) => formatPeriodKey(String(label))}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #E9E9F2",
                boxShadow: "0px 4px 12px #9190a014",
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            />
            {activeCategories.map((cat) => {
              const colorIndex = sortedCategories.findIndex((c) => c.name === cat.name);
              return (
                <Line
                  key={cat.name}
                  type="monotone"
                  dataKey={cat.displayName}
                  stroke={CATEGORY_COLORS[colorIndex % CATEGORY_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
