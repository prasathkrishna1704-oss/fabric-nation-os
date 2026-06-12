"use client";

import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart,
} from "recharts";
import { formatCurrency } from "@/lib/format";

interface SalesChartProps {
  data: { date: string; gst: number; nonGst: number; total: number }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl p-3.5 text-xs min-w-[160px] border border-[#E5EAF0]"
      style={{ boxShadow: "0 4px 24px rgba(29, 30, 39, 0.12)" }}
    >
      <p className="font-semibold text-[#1D1E27] mb-2.5 text-[11px] uppercase tracking-wider">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 justify-between py-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
            <span className="text-[#4B4E53]">{entry.name}</span>
          </div>
          <span className="font-bold text-[#1D1E27]">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

export function SalesChart({ data }: SalesChartProps) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="gstGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1D1E27" stopOpacity={0.12} />
              <stop offset="100%" stopColor="#1D1E27" stopOpacity={0.01} />
            </linearGradient>
            <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C80018" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#C80018" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF0" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#4B4E53", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#4B4E53", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="gst"
            name="GST Invoice"
            stroke="#1D1E27"
            strokeWidth={2.5}
            fill="url(#gstGradient)"
            dot={{ fill: "#1D1E27", strokeWidth: 0, r: 4 }}
            activeDot={{ fill: "#1D1E27", strokeWidth: 2, stroke: "rgba(29,30,39,0.2)", r: 6 }}
          />
          <Area
            type="monotone"
            dataKey="nonGst"
            name="Cash Bill"
            stroke="#C80018"
            strokeWidth={2.5}
            fill="url(#cashGradient)"
            dot={{ fill: "#C80018", strokeWidth: 0, r: 4 }}
            activeDot={{ fill: "#C80018", strokeWidth: 2, stroke: "rgba(200,0,24,0.2)", r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface TopProductsChartProps {
  data: { name: string; revenue: number; qty: number }[];
}

export function TopProductsChart({ data }: TopProductsChartProps) {
  const maxRevenue = Math.max(...data.map(d => d.revenue));

  const barColors = [
    { bar: "from-[#C80018] to-[#FF0000]", text: "text-[#C80018]" },
    { bar: "from-[#1D1E27] to-[#2D2E37]", text: "text-[#1D1E27]" },
    { bar: "from-[#4B4E53] to-[#5B5E63]", text: "text-[#4B4E53]" },
    { bar: "from-[#C80018] to-[#FF3333]", text: "text-[#C80018]" },
    { bar: "from-[#1D1E27] to-[#4B4E53]", text: "text-[#1D1E27]" },
  ];

  return (
    <div className="space-y-3.5">
      {data.map((item, i) => {
        const percentage = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
        const color = barColors[i % barColors.length];

        return (
          <div key={`${item.name}-${i}`} className="group">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-[#4B4E53] truncate max-w-[140px]">{item.name}</span>
              <span className={`text-xs font-bold ${color.text}`}>{formatCurrency(item.revenue)}</span>
            </div>
            <div className="h-2 rounded-full bg-[#EDF2F4] overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${color.bar} transition-all duration-700 ease-out`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
