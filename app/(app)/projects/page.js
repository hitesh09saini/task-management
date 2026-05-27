"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, X, Calendar, Loader2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import AvatarGroup from "@/components/AvatarGroup";
import ProgressBar from "@/components/ProgressBar";

const STATUSES = ["all", "planning", "active", "on_hold", "completed", "archived"];
const emptyForm = {
  name: "",
  description: "",
  status: "planning",
  deadline: "",
  members: [],
};

export default function ProjectsPage() {
  const [me, setMe] = useState(null);
  const [projects, setProjects] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    const meRes = await fetch("/api/auth/me");
    const meData = meRes.ok ? await meRes.json() : null;
    const u = meData?.user;
    setMe(u);

    const isAdmin = u?.role === "admin";
    const calls = [
      fetch("/api/projects").then((r) => r.json()),
      fetch(isAdmin ? "/api/admin/tasks" : "/api/tasks").then((r) => r.json()),
    ];
    if (isAdmin)
      calls.push(fetch("/api/admin/users").then((r) => r.json()));
    const [p, t, allUsers] = await Promise.all(calls);
    setProjects(p.projects || []);
    setAllTasks(t.tasks || []);
    setUsers(allUsers?.users || []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  const isAdmin = me?.role === "admin";

  const progressById = useMemo(() => {
    const m = new Map();
    for (const t of allTasks) {
      const pid = t.project?._id || t.project;
      if (!pid) continue;
      const e = m.get(String(pid)) || { total: 0, done: 0 };
      e.total += 1;
      if (t.status === "done") e.done += 1;
      m.set(String(pid), e);
    }
    return m;
  }, [allTasks]);

  const visible = useMemo(() => {
    const q = query.toLowerCase();
    return projects.filter((p) => {
      if (filter !== "all" && p.status !== filter) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [projects, query, filter]);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setErr(data.error || "Failed to create project");
      return;
    }
    setForm(emptyForm);
    setShowForm(false);
    load();
  }

  function toggleMember(id) {
    setForm((f) => ({
      ...f,
      members: f.members.includes(id)
        ? f.members.filter((m) => m !== id)
        : [...f.members, id],
    }));
  }

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle={
          isAdmin
            ? "Create projects, assign teams and monitor progress."
            : "Projects you're a member of."
        }
        actions={
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New project
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-10 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex gap-1 overflow-auto thin-scroll">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-2 rounded-lg text-sm capitalize whitespace-nowrap ${
                filter === s
                  ? "bg-brand-600 text-white"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : visible.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-12 text-center text-sm text-slate-500">
          No projects match.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((p) => {
            const stats = progressById.get(String(p._id)) || { total: 0, done: 0 };
            const pct = stats.total === 0 ? 0 : (stats.done / stats.total) * 100;
            return (
              <Link
                key={p._id}
                href={`/projects/${p._id}`}
                className="group bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-xl p-5 shadow-card hover:border-brand-500 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold group-hover:text-brand-600 line-clamp-1">
                    {p.name}
                  </h3>
                  <StatusBadge kind="project" value={p.status} />
                </div>
                {p.description && (
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                    {p.description}
                  </p>
                )}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-500">Progress</span>
                    <span className="font-medium">
                      {stats.done}/{stats.total}
                    </span>
                  </div>
                  <ProgressBar
                    value={pct}
                    tone={pct === 100 ? "emerald" : "brand"}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <AvatarGroup users={p.members || []} size={24} />
                  {p.deadline && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(p.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {showForm && (
        <Modal title="New project" onClose={() => setShowForm(false)}>
          <form onSubmit={submit} className="space-y-3 text-sm">
            <Input
              required
              placeholder="Project name"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
            />
            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg h-20"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on_hold">On hold</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
              />
            </div>
            {isAdmin ? (
              <div>
                <p className="font-medium mb-1">Team members</p>
                <div className="max-h-44 overflow-auto thin-scroll border border-slate-200 dark:border-slate-800 rounded-lg p-2 space-y-1">
                  {users.length === 0 && (
                    <p className="text-xs text-slate-500 px-1">No users found.</p>
                  )}
                  {users.map((u) => (
                    <label
                      key={u._id}
                      className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={form.members.includes(u._id)}
                        onChange={() => toggleMember(u._id)}
                        className="accent-brand-600"
                      />
                      <span>
                        {u.name}{" "}
                        <span className="text-xs text-slate-500">
                          ({u.email})
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                You'll be added as the project creator. An admin can add more
                members later.
              </p>
            )}
            {err && (
              <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                {err}
              </p>
            )}
            <div className="flex gap-2 pt-2">
              <button
                disabled={busy}
                className="flex-1 px-3 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                Create project
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Input({ value, onChange, ...rest }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
      {...rest}
    />
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
