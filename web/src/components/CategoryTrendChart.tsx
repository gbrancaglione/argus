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
];

const MONTH_NAMES: Record<string, string> = {
  "01": "Jan", "02": "Fev", "03": "Mar", "04": "Abr",
  "05": "Mai", "06": "Jun", "07": "Jul", "08": "Ago",
  "09": "Set", "10": "Out", "11": "Nov", "12": "Dez",
};

function formatMonth(yyyyMm: string) {
  const [, m] = yyyyMm.split("-");
  return MONTH_NAMES[m] ?? m;
}

type CategoryTrendChartProps = {
  data: Record<string, Record<string, number>>;
  months: string[];
};

export default function CategoryTrendChart({ data, months }: CategoryTrendChartProps) {
  const categories = Object.keys(data).slice(0, 5);

  if (categories.length === 0 || months.length === 0) {
    return (
      <p className="text-neutral-medium text-sm py-8 text-center">
        Sem dados para o periodo selecionado.
      </p>
    );
  }

  const chartData = months.map((month) => {
    const point: Record<string, string | number> = { month };
    for (const cat of categories) {
      point[cat ?? "Sem categoria"] = data[cat]?.[month] ?? 0;
    }
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E9E9F2" />
        <XAxis
          dataKey="month"
          tickFormatter={formatMonth}
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
          formatter={(value, name) => [formatBRL(Number(value)), String(name)]}
          labelFormatter={(label) => formatMonth(String(label))}
          contentStyle={{
            borderRadius: 8,
            border: "1px solid #E9E9F2",
            boxShadow: "0px 4px 12px #9190a014",
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
        />
        {categories.map((cat, i) => (
          <Line
            key={cat ?? "uncategorized"}
            type="monotone"
            dataKey={cat ?? "Sem categoria"}
            stroke={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
