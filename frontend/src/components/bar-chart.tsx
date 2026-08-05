"use client";
import React, { useState } from "react";
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function BarChart({ data }: { data: { period: string; revenue: string | number }[] }) {
  const [range, setRange] = useState<"3M" | "6M" | "1Y">("6M");

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center border border-loom bg-[#f7f1e7] p-5 text-sm text-walnut/60">
        No revenue data yet.
      </div>
    );
  }

  const monthsCount = range === "3M" ? 3 : range === "6M" ? 6 : 12;

  // Generate the last N months
  const months: string[] = [];
  const now = new Date();
  for (let i = monthsCount - 1; i >= 0; i--) {
    const d2 = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d2.toLocaleString("en-US", { month: "short" }));
  }

  // Map data to the last N months
  const chartData = months.map((month) => {
    const found = data.find((d) => d.period === month);
    return {
      period: month,
      revenue: found ? Number(found.revenue) : 0,
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="border border-loom bg-cotton p-3 shadow-sm">
          <p className="font-data text-xs uppercase text-ochre mb-1">{payload[0].payload.period}</p>
          <p className="font-semibold text-indigo-dye">
            ₹{Number(payload[0].value).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {(["3M", "6M", "1Y"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`rounded-sm border px-3 py-1 text-xs font-semibold transition-colors ${
              range === r
                ? "border-indigo-dye bg-indigo-dye text-cotton"
                : "border-loom bg-transparent text-indigo-dye hover:bg-indigo-dye/10"
            }`}
          >
            {r}
          </button>
        ))}
      </div>
      <div className="h-[300px] w-full border border-loom bg-[#f7f1e7] p-4 pt-6">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d5cebd" />
            <XAxis 
              dataKey="period" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fontFamily: "monospace", fill: "#5c564b" }} 
              dy={10} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fontFamily: "monospace", fill: "#5c564b" }} 
              tickFormatter={(value) => value === 0 ? "0" : Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(value)}
            />
            <Tooltip cursor={{ fill: 'rgba(213, 206, 189, 0.4)' }} content={<CustomTooltip />} />
            <Bar dataKey="revenue" fill="#1a2b4c" radius={[2, 2, 0, 0]} maxBarSize={50} />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
