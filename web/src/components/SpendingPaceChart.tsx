import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from "recharts";
import { formatBRL } from "../utils/format";
import type { SpendingPaceData } from "../types/spending";

const MONTH_COLORS = [
  "#59399E",
  "#A6CD15",
  "#3DE4F5",
  "#E94A4A",
  "#F1AF0F",
  "#268041",
  "#AB9DE8",
  "#D9F363",
];

type SpendingPaceChartProps = {
  data: SpendingPaceData;
};

export default function SpendingPaceChart({ data }: SpendingPaceChartProps) {
  const monthKeys = Object.keys(data.months).sort();

  if (monthKeys.length === 0) {
    return (
      <p className="text-neutral-medium text-sm py-8 text-center">
        Sem dados para exibir.
      </p>
    );
  }

  // Find max day across all months
  const maxDay = Math.max(
    ...monthKeys.map((k) => {
      const days = Object.keys(data.months[k].days).map(Number);
      return days.length > 0 ? Math.max(...days) : 0;
    })
  );

  // Build chart data: one point per day, with a column per month
  const chartData = [];
  for (let d = 1; d <= maxDay; d++) {
    const point: Record<string, number | string> = { day: d };
    for (const key of monthKeys) {
      const val = data.months[key].days[d];
      if (val !== undefined) {
        point[key] = val;
      }
    }
    chartData.push(point);
  }

  const currentMonth = data.current_month;

  return (
    <ResponsiveContainer width="100%" height={340}>
      <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E9E9F2" />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 12, fill: "#79778C" }}
          axisLine={{ stroke: "#E9E9F2" }}
          tickLine={false}
          label={{ value: "Dia do mês", position: "insideBottomRight", offset: -5, fontSize: 11, fill: "#79778C" }}
        />
        <YAxis
          tickFormatter={(v: number) => formatBRL(v)}
          tick={{ fontSize: 11, fill: "#79778C" }}
          axisLine={false}
          tickLine={false}
          width={90}
        />
        <Tooltip
          formatter={(value: number, name: string) => {
            const monthData = data.months[name];
            const label = monthData?.label ?? name;
            return [formatBRL(value), label];
          }}
          labelFormatter={(day) => `Dia ${day}`}
          contentStyle={{
            borderRadius: 8,
            border: "1px solid #E9E9F2",
            boxShadow: "0px 4px 12px #9190a014",
          }}
        />
        <Legend
          formatter={(value: string) => data.months[value]?.label ?? value}
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
        />
        <ReferenceLine
          x={data.today}
          stroke="#79778C"
          strokeDasharray="4 4"
          strokeWidth={1.5}
          label={{ value: "Hoje", position: "top", fontSize: 11, fill: "#79778C" }}
        />
        {monthKeys.map((key, i) => {
          const isCurrent = key === currentMonth;
          return (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={isCurrent ? "#59399E" : MONTH_COLORS[(i + 1) % MONTH_COLORS.length]}
              strokeWidth={isCurrent ? 3 : 1.5}
              strokeOpacity={isCurrent ? 1 : 0.4}
              dot={isCurrent ? { r: 3 } : false}
              activeDot={isCurrent ? { r: 5 } : { r: 3 }}
              connectNulls
            />
          );
        })}
      </LineChart>
    </ResponsiveContainer>
  );
}
