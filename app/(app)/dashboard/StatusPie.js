"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = {
  todo: "#F59E0B",
  in_progress: "#2563EB",
  done: "#22C55E",
};
const LABELS = {
  todo: "Pending",
  in_progress: "In progress",
  done: "Completed",
};

export default function StatusPie({ data = {} }) {
  const rows = ["todo", "in_progress", "done"].map((k) => ({
    name: LABELS[k],
    key: k,
    value: data[k] || 0,
  }));
  const total = rows.reduce((s, r) => s + r.value, 0);

  if (total === 0) {
    return (
      <p className="text-sm text-slate-500 py-12 text-center">
        No task data yet.
      </p>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={rows}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={85}
            paddingAngle={2}
            isAnimationActive
          >
            {rows.map((r) => (
              <Cell key={r.key} fill={COLORS[r.key]} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              fontSize: 12,
            }}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            wrapperStyle={{ fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
