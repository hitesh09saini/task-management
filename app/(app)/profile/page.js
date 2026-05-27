"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Mail, Shield, Calendar } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Avatar from "@/components/Avatar";
import StatusBadge from "@/components/StatusBadge";
import ProgressBar from "@/components/ProgressBar";

export default function ProfilePage() {
  const [me, setMe] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [meRes, tRes, sRes] = await Promise.all([
        fetch("/api/auth/me").then((r) => r.json()),
        fetch("/api/tasks").then((r) => r.json()),
        fetch("/api/dashboard/stats").then((r) => r.json()),
      ]);
      setMe(meRes.user);
      setTasks(tRes.tasks || []);
      setStats(sRes);
      setLoading(false);
    })();
  }, []);

  const completion = useMemo(() => {
    if (!stats) return 0;
    if (!stats.totalTasks) return 0;
    return Math.round((stats.completedTasks / stats.totalTasks) * 100);
  }, [stats]);

  if (loading || !me) return <p className="text-slate-500">Loading...</p>;

  const memberSinceTask = tasks.length
    ? new Date(
        tasks.reduce((min, t) => (t.createdAt < min ? t.createdAt : min), tasks[0].createdAt)
      )
    : null;

  return (
    <div>
      <PageHeader title="Profile" subtitle="Your account and workload." />

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-xl shadow-card p-6 flex flex-col items-center text-center">
          <Avatar name={me.name} size={96} />
          <h2 className="mt-4 font-bold text-lg">{me.name}</h2>
          <span
            className={`mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
              me.role === "admin"
                ? "bg-brand-100 text-brand-700"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {me.role}
          </span>
          <dl className="mt-6 w-full space-y-3 text-sm text-left">
            <Row icon={Mail} label="Email" value={me.email} />
            <Row icon={Shield} label="Role" value={me.role} />
            {memberSinceTask && (
              <Row
                icon={Calendar}
                label="First task"
                value={memberSinceTask.toLocaleDateString()}
              />
            )}
          </dl>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-xl shadow-card p-6">
          <h2 className="font-semibold mb-4">Performance</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <Mini label="Assigned" value={stats?.totalTasks ?? 0} />
            <Mini
              label="Completed"
              value={stats?.completedTasks ?? 0}
              tone="emerald"
            />
            <Mini
              label="Pending"
              value={stats?.pendingTasks ?? 0}
              tone="amber"
            />
            <Mini
              label="Overdue"
              value={stats?.overdue ?? 0}
              tone="rose"
            />
          </div>
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-500">Completion rate</span>
              <span className="font-medium">{completion}%</span>
            </div>
            <ProgressBar
              value={completion}
              tone={completion === 100 ? "emerald" : "brand"}
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-xl shadow-card p-5">
        <h2 className="font-semibold mb-3">Assigned tasks</h2>
        {tasks.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">
            No tasks assigned to you yet.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {tasks.slice(0, 8).map((t) => (
              <li
                key={t._id}
                className="py-3 flex items-center justify-between gap-3 text-sm"
              >
                <Link
                  href={`/tasks/${t._id}`}
                  className="font-medium hover:text-brand-600 truncate"
                >
                  {t.title}
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge kind="priority" value={t.priority} />
                  <StatusBadge kind="task" value={t.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-slate-400" />
      <div className="flex-1 min-w-0">
        <div className="text-xs uppercase tracking-wide text-slate-500">
          {label}
        </div>
        <div className="font-medium truncate capitalize">{value}</div>
      </div>
    </div>
  );
}

function Mini({ label, value, tone = "slate" }) {
  const t = {
    slate: "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200",
    emerald:
      "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    amber: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400",
    rose: "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400",
  }[tone];
  return (
    <div className={`rounded-lg p-3 ${t}`}>
      <div className="text-xl font-bold leading-none">{value}</div>
      <div className="text-[11px] uppercase tracking-wide mt-1">{label}</div>
    </div>
  );
}
