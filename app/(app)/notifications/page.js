"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bell,
  CheckCheck,
  Trash2,
  UserPlus,
  ListTodo,
  MessageSquare,
  Activity,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";

const ICONS = {
  task_assigned: ListTodo,
  task_updated: Activity,
  task_commented: MessageSquare,
  project_added: UserPlus,
  project_updated: Activity,
  deadline_soon: Bell,
  info: Bell,
};

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/notifications");
    const data = await res.json();
    setItems(data.notifications || []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function markAll() {
    await fetch("/api/notifications", { method: "PUT" });
    load();
  }
  async function markOne(id) {
    await fetch(`/api/notifications/${id}`, { method: "PUT" });
    load();
  }
  async function remove(id) {
    await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    load();
  }

  const unread = items.filter((i) => !i.read).length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={`${unread} unread of ${items.length}`}
        actions={
          unread > 0 && (
            <button
              onClick={markAll}
              className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          )
        }
      />

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-16 text-center">
          <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">You're all caught up.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => {
            const Icon = ICONS[n.type] || Bell;
            return (
              <li
                key={n._id}
                className={`bg-white dark:bg-slate-900 border rounded-xl shadow-card p-4 flex items-start gap-3 ${
                  n.read
                    ? "border-slate-200 dark:border-slate-800"
                    : "border-brand-300 dark:border-brand-600"
                }`}
              >
                <span
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    n.read
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      : "bg-brand-50 dark:bg-brand-600/10 text-brand-600"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
                    <span className="capitalize">
                      {n.type.replace(/_/g, " ")}
                    </span>
                    <span>·</span>
                    <span>{new Date(n.createdAt).toLocaleString()}</span>
                    {!n.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                    )}
                  </div>
                  {n.link ? (
                    <Link
                      href={n.link}
                      onClick={() => !n.read && markOne(n._id)}
                      className="text-sm font-medium hover:text-brand-600"
                    >
                      {n.message}
                    </Link>
                  ) : (
                    <span className="text-sm font-medium">{n.message}</span>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  {!n.read && (
                    <button
                      onClick={() => markOne(n._id)}
                      className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                      title="Mark read"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => remove(n._id)}
                    className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
