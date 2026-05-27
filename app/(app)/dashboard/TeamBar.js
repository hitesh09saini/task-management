"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function TeamBar({ data = [], labelKey = "name" }) {
  if (!data.length) {
    return (
      <p className="text-sm text-slate-500 py-12 text-center">
        No data to chart yet.
      </p>
    );
  }
  const rows = data.map((d) => ({
    name: d[labelKey] || d.name || "—",
    count: d.count || 0,
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(37, 99, 235, 0.08)" }}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              fontSize: 12,
            }}
          />
          <Bar
            dataKey="count"
            fill="#2563EB"
            radius={[6, 6, 0, 0]}
            isAnimationActive
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
