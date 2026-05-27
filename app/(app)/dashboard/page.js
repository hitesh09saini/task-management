"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FolderKanban,
  ListTodo,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import AvatarGroup from "@/components/AvatarGroup";
import Avatar from "@/components/Avatar";
import PageHeader from "@/components/PageHeader";
import StatusPie from "./StatusPie";
import TeamBar from "./TeamBar";
import ProductivityChart from "./ProductivityChart";

export default function DashboardPage() {
  const [me, setMe] = useState(null);
  const [stats, setStats] = useState(null);
  const [adminStats, setAdminStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    (async () => {
      const meRes = await fetch("/api/auth/me");
      const meData = meRes.ok ? await meRes.json() : null;
      const user = meData?.user;
      setMe(user);

      const isAdmin = user?.role === "admin";
      const calls = [
        fetch("/api/dashboard/stats").then((r) => r.json()),
        fetch(isAdmin ? "/api/admin/tasks" : "/api/tasks").then((r) => r.json()),
        fetch("/api/projects").then((r) => r.json()),
        fetch("/api/activity?limit=8").then((r) => r.json()),
      ];
      if (isAdmin)
        calls.push(fetch("/api/admin/stats").then((r) => r.json()));
      const [s, t, p, act, a] = await Promise.all(calls);
      setStats(s);
      setTasks(t.tasks || []);
      setProjects(p.projects || []);
      setActivities(act.activities || []);
      if (a) setAdminStats(a);
    })();
  }, []);

  const upcoming = useMemo(() => {
    const now = Date.now();
    const in7 = now + 7 * 24 * 60 * 60 * 1000;
    return tasks
      .filter(
        (t) =>
          t.dueDate &&
          t.status !== "done" &&
          new Date(t.dueDate).getTime() >= now &&
          new Date(t.dueDate).getTime() <= in7
      )
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);
  }, [tasks]);

  const recent = useMemo(
    () =>
      [...tasks]
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 6),
    [tasks]
  );

  if (!stats || !me)
    return <p className="text-slate-500">Loading...</p>;

  const isAdmin = me.role === "admin";
  const isUserView = !isAdmin;

  return (
    <div>
      <PageHeader
        title={isAdmin ? "Admin dashboard" : "My dashboard"}
        subtitle={
          isAdmin
            ? "Overview of users, projects, tasks and deadlines."
            : "Tasks assigned to you and a snapshot of your workload."
        }
      />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Projects"
          value={isAdmin ? adminStats?.projectCount ?? "—" : stats.projectCount}
          icon={FolderKanban}
          tone="brand"
        />
        <StatCard
          label="Total Tasks"
          value={isAdmin ? adminStats?.taskCount ?? "—" : stats.totalTasks}
          icon={ListTodo}
          tone="slate"
        />
        <StatCard
          label="Pending Tasks"
          value={
            isAdmin
              ? (adminStats?.taskStatus.todo ?? 0) +
                (adminStats?.taskStatus.in_progress ?? 0)
              : stats.pendingTasks
          }
          icon={Clock}
          tone="amber"
        />
        <StatCard
          label="Completed"
          value={
            isAdmin ? adminStats?.taskStatus.done ?? "—" : stats.completedTasks
          }
          icon={CheckCircle2}
          tone="emerald"
        />
      </section>

      <section className="grid lg:grid-cols-3 gap-4 mb-6">
        <Card title="Task status">
          <StatusPie
            data={
              isAdmin
                ? adminStats?.taskStatus || stats.status
                : stats.status
            }
          />
        </Card>
        <Card title="Productivity (last 14 days)" className="lg:col-span-2">
          <ProductivityChart days={14} />
        </Card>
      </section>

      <section className="grid lg:grid-cols-3 gap-4 mb-6">
        <Card
          title={isAdmin ? "Team performance" : "Your priority mix"}
          className="lg:col-span-2"
        >
          {isAdmin ? (
            <TeamBar data={adminStats?.perAssignee || []} />
          ) : (
            <TeamBar
              data={[
                { name: "High", count: stats.priority.high },
                { name: "Medium", count: stats.priority.medium },
                { name: "Low", count: stats.priority.low },
              ]}
              labelKey="name"
            />
          )}
        </Card>
        <Card title="Upcoming deadlines">
          {upcoming.length === 0 ? (
            <Empty text="Clear for the next 7 days." />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {upcoming.map((t) => (
                <li
                  key={t._id}
                  className="py-2.5 flex items-center gap-3 text-sm"
                >
                  <span className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/tasks/${t._id}`}
                      className="font-medium hover:text-brand-600 truncate block"
                    >
                      {t.title}
                    </Link>
                    <div className="text-xs text-slate-500 truncate">
                      {new Date(t.dueDate).toLocaleDateString()}
                      {isAdmin && t.assignedTo
                        ? ` · ${t.assignedTo.name}`
                        : ""}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section className="grid lg:grid-cols-3 gap-4 mb-6">
        <Card title="Recent activity" className="lg:col-span-2">
          {activities.length === 0 ? (
            <Empty text="Nothing yet." />
          ) : (
            <ul className="space-y-3">
              {activities.map((a) => (
                <li key={a._id} className="flex gap-3 text-sm">
                  <Avatar
                    name={a.actor?.name || a.actorName || "?"}
                    size={28}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-slate-700 dark:text-slate-300">
                      <span className="font-medium">
                        {a.actor?.name || a.actorName || "Someone"}
                      </span>{" "}
                      {a.message}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(a.createdAt).toLocaleString()}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Recent updates">
          {recent.length === 0 ? (
            <Empty text="Nothing yet." />
          ) : (
            <ul className="space-y-3">
              {recent.slice(0, 5).map((t) => (
                <li key={t._id} className="text-sm">
                  <Link
                    href={`/tasks/${t._id}`}
                    className="font-medium hover:text-brand-600 line-clamp-1"
                  >
                    {t.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge kind="task" value={t.status} />
                    <span className="text-xs text-slate-500">
                      {new Date(t.updatedAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      {isAdmin && (
        <section>
          <Card title="Recent projects">
            {projects.length === 0 ? (
              <Empty text="No projects yet." />
            ) : (
              <ul className="grid md:grid-cols-2 gap-3">
                {projects.slice(0, 4).map((p) => (
                  <li
                    key={p._id}
                    className="border border-slate-200 dark:border-slate-800 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/projects/${p._id}`}
                          className="font-medium hover:text-brand-600"
                        >
                          {p.name}
                        </Link>
                        <div className="mt-1 flex items-center gap-2">
                          <StatusBadge kind="project" value={p.status} />
                          {p.deadline && (
                            <span className="text-xs text-slate-500">
                              Due {new Date(p.deadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <AvatarGroup users={p.members || []} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>
      )}
    </div>
  );
}

function Card({ title, children, className = "" }) {
  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800 shadow-card p-5 ${className}`}
    >
      <h3 className="font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
}

function Empty({ text }) {
  return (
    <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
      {text}
    </p>
  );
}
