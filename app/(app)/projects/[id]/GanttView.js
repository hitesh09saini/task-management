"use client";

import Link from "next/link";
import { useMemo } from "react";
import StatusBadge from "@/components/StatusBadge";
import Avatar from "@/components/Avatar";

const DAY = 24 * 60 * 60 * 1000;

const BAR_COLORS = {
  todo: "bg-amber-400",
  in_progress: "bg-blue-500",
  done: "bg-emerald-500",
};

export default function GanttView({ tasks, project }) {
  const dated = tasks.filter((t) => t.dueDate || t.startDate);

  const { min, max, days } = useMemo(() => {
    if (!dated.length) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return { min: today, max: new Date(today.getTime() + 13 * DAY), days: 14 };
    }
    let lo = Infinity,
      hi = -Infinity;
    for (const t of dated) {
      const s = t.startDate ? new Date(t.startDate).getTime() : null;
      const d = t.dueDate ? new Date(t.dueDate).getTime() : null;
      if (s !== null) lo = Math.min(lo, s);
      if (d !== null) {
        hi = Math.max(hi, d);
        if (s === null) lo = Math.min(lo, d - 3 * DAY);
      }
    }
    if (project?.deadline) {
      const pd = new Date(project.deadline).getTime();
      hi = Math.max(hi, pd);
    }
    // pad by a day on each side
    lo -= DAY;
    hi += DAY;
    const minD = new Date(lo);
    minD.setHours(0, 0, 0, 0);
    const maxD = new Date(hi);
    maxD.setHours(0, 0, 0, 0);
    const days = Math.max(7, Math.ceil((maxD - minD) / DAY) + 1);
    return { min: minD, max: maxD, days };
  }, [dated, project]);

  if (dated.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-12 text-center">
        No tasks with dates yet. Add a due date to see them on the timeline.
      </p>
    );
  }

  const totalMs = days * DAY;
  const minTs = min.getTime();
  const todayTs = new Date().setHours(0, 0, 0, 0);
  const todayPct = ((todayTs - minTs) / totalMs) * 100;

  const dayHeaders = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(minTs + i * DAY);
    dayHeaders.push(d);
  }
  const showEvery = days <= 21 ? 1 : days <= 60 ? 3 : 7;

  return (
    <div className="overflow-x-auto thin-scroll">
      <div className="min-w-[700px]">
        <div className="grid grid-cols-[200px_1fr] border-b border-slate-200 dark:border-slate-800 pb-2 mb-2">
          <div className="text-xs uppercase tracking-wide text-slate-500 font-medium">
            Task
          </div>
          <div className="relative h-6">
            <div className="absolute inset-0 flex">
              {dayHeaders.map((d, i) =>
                i % showEvery === 0 ? (
                  <div
                    key={i}
                    style={{ left: `${(i / days) * 100}%` }}
                    className="absolute text-[10px] text-slate-500 -translate-x-1/2"
                  >
                    {d.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                ) : null
              )}
            </div>
          </div>
        </div>

        <div className="relative space-y-1.5">
          {todayPct >= 0 && todayPct <= 100 && (
            <div
              className="absolute top-0 bottom-0 w-px bg-rose-500/70 z-10"
              style={{ left: `calc(200px + ${todayPct}% * ((100% - 200px) / 100%))` }}
              title="Today"
            />
          )}
          {dated.map((t) => {
            const s = t.startDate
              ? new Date(t.startDate).getTime()
              : t.dueDate
                ? new Date(t.dueDate).getTime() - 2 * DAY
                : minTs;
            const e = t.dueDate
              ? new Date(t.dueDate).getTime()
              : s + DAY;
            const left = Math.max(0, ((s - minTs) / totalMs) * 100);
            const width = Math.max(2, ((e - s) / totalMs) * 100);
            return (
              <div
                key={t._id}
                className="grid grid-cols-[200px_1fr] items-center gap-2 text-sm"
              >
                <div className="pr-2 truncate">
                  <Link
                    href={`/tasks/${t._id}`}
                    className="font-medium hover:text-brand-600 truncate"
                  >
                    {t.title}
                  </Link>
                  {t.assignedTo && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Avatar name={t.assignedTo.name} size={14} />
                      <span className="truncate">{t.assignedTo.name}</span>
                    </div>
                  )}
                </div>
                <div className="relative h-7 bg-slate-50 dark:bg-slate-800/30 rounded">
                  <div
                    className={`absolute top-1 bottom-1 rounded ${BAR_COLORS[t.status] || "bg-slate-400"} shadow-sm`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={`${t.title} · ${new Date(s).toLocaleDateString()} → ${new Date(e).toLocaleDateString()}`}
                  >
                    <span className="absolute inset-0 px-2 flex items-center text-[10px] text-white font-medium truncate">
                      {t.priority}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex items-center gap-4 text-xs">
          <Legend color="bg-amber-400" label="Pending" />
          <Legend color="bg-blue-500" label="In progress" />
          <Legend color="bg-emerald-500" label="Completed" />
          <Legend color="bg-rose-500" label="Today" line />
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label, line }) {
  return (
    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
      {line ? (
        <span className="w-px h-3 bg-rose-500" />
      ) : (
        <span className={`w-3 h-3 rounded ${color}`} />
      )}
      {label}
    </span>
  );
}
