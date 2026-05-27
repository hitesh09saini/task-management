"use client";

import { useEffect, useState } from "react";
import {
  Users,
  FolderKanban,
  ListTodo,
  AlertTriangle,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import StatusPie from "../dashboard/StatusPie";
import TeamBar from "../dashboard/TeamBar";
import ExportButtons from "./ExportButtons";

export default function ReportsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      setStats(data);
      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="text-slate-500">Loading...</p>;
  if (!stats || stats.error)
    return <p className="text-rose-600">Failed to load stats.</p>;

  const taskTotal =
    stats.taskStatus.todo +
    stats.taskStatus.in_progress +
    stats.taskStatus.done;
  const completionRate =
    taskTotal === 0 ? 0 : Math.round((stats.taskStatus.done / taskTotal) * 100);

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Workload, throughput and deadlines across the system."
        actions={<ExportButtons stats={stats} />}
      />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Users"
          value={stats.userCount}
          hint={`${stats.adminCount} admin`}
          icon={Users}
        />
        <StatCard
          label="Projects"
          value={stats.projectCount}
          icon={FolderKanban}
          tone="brand"
        />
        <StatCard
          label="Tasks"
          value={stats.taskCount}
          hint={`${completionRate}% done`}
          icon={ListTodo}
          tone="emerald"
        />
        <StatCard
          label="Overdue"
          value={stats.overdue}
          hint={`${stats.upcoming} due this week`}
          icon={AlertTriangle}
          tone="rose"
        />
      </section>

      <section className="grid lg:grid-cols-3 gap-4 mb-6">
        <Card title="Tasks by status">
          <StatusPie data={stats.taskStatus} />
        </Card>
        <Card title="Top assignees" className="lg:col-span-2">
          <TeamBar data={stats.perAssignee} />
        </Card>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <Card title="Tasks by priority">
          <Bars
            rows={[
              {
                label: "High",
                value: stats.taskPriority.high,
                color: "bg-rose-500",
              },
              {
                label: "Medium",
                value: stats.taskPriority.medium,
                color: "bg-amber-500",
              },
              {
                label: "Low",
                value: stats.taskPriority.low,
                color: "bg-slate-400",
              },
            ]}
          />
        </Card>
        <Card title="Projects by status">
          <Bars
            rows={[
              {
                label: "Planning",
                value: stats.projectStatus.planning,
                color: "bg-slate-400",
              },
              {
                label: "Active",
                value: stats.projectStatus.active,
                color: "bg-brand-500",
              },
              {
                label: "On hold",
                value: stats.projectStatus.on_hold,
                color: "bg-amber-500",
              },
              {
                label: "Completed",
                value: stats.projectStatus.completed,
                color: "bg-emerald-500",
              },
              {
                label: "Archived",
                value: stats.projectStatus.archived,
                color: "bg-slate-300",
              },
            ]}
          />
        </Card>
      </section>
    </div>
  );
}

function Card({ title, children, className = "" }) {
  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-xl shadow-card p-5 ${className}`}
    >
      <h3 className="font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Bars({ rows }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="space-y-3 text-sm">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-600 dark:text-slate-400">
              {r.label}
            </span>
            <span className="font-medium">{r.value}</span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${r.color}`}
              style={{ width: `${(r.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
