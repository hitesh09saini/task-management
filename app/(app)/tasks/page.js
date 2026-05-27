"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Trash2,
  X,
  Loader2,
  Table as TableIcon,
  LayoutGrid,
  Download,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import Avatar from "@/components/Avatar";
import KanbanBoard from "./KanbanBoard";

const STATUSES = ["all", "todo", "in_progress", "done"];
const STATUS_LABEL = {
  all: "All",
  todo: "Pending",
  in_progress: "In progress",
  done: "Completed",
};

const emptyForm = {
  title: "",
  description: "",
  priority: "medium",
  dueDate: "",
  assignedTo: "",
  project: "",
};

export default function TasksPage() {
  const [me, setMe] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [dueFrom, setDueFrom] = useState("");
  const [dueTo, setDueTo] = useState("");
  const [view, setView] = useState("table"); // "table" | "board"
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    const meRes = await fetch("/api/auth/me");
    const u = meRes.ok ? (await meRes.json()).user : null;
    setMe(u);
    const isAdmin = u?.role === "admin";
    const calls = [
      fetch(isAdmin ? "/api/admin/tasks" : "/api/tasks").then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
    ];
    if (isAdmin) calls.push(fetch("/api/admin/users").then((r) => r.json()));
    const [t, p, allUsers] = await Promise.all(calls);
    setTasks(t.tasks || []);
    setProjects(p.projects || []);
    if (allUsers) setUsers(allUsers.users || []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  const isAdmin = me?.role === "admin";

  const visible = useMemo(() => {
    const q = query.toLowerCase();
    const fromTs = dueFrom ? new Date(dueFrom).getTime() : null;
    const toTs = dueTo ? new Date(dueTo).getTime() + 86399999 : null;
    return tasks.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter)
        return false;
      if (
        assigneeFilter !== "all" &&
        String(t.assignedTo?._id) !== assigneeFilter
      )
        return false;
      if (fromTs && (!t.dueDate || new Date(t.dueDate).getTime() < fromTs))
        return false;
      if (toTs && (!t.dueDate || new Date(t.dueDate).getTime() > toTs))
        return false;
      if (q && !t.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [tasks, query, statusFilter, priorityFilter, assigneeFilter, dueFrom, dueTo]);

  async function quickStatus(t, status) {
    await fetch(`/api/tasks/${t._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function remove(id) {
    if (!confirm("Delete this task?")) return;
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    load();
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const payload = { ...form };
    if (!payload.project) delete payload.project;
    if (!payload.assignedTo) delete payload.assignedTo;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setErr(data.error || "Failed");
      return;
    }
    setForm(emptyForm);
    setShowForm(false);
    load();
  }

  const counts = useMemo(() => {
    const c = { all: tasks.length, todo: 0, in_progress: 0, done: 0 };
    for (const t of tasks) c[t.status] = (c[t.status] || 0) + 1;
    return c;
  }, [tasks]);

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle={
          isAdmin
            ? "All tasks across the system."
            : "Tasks you created or that are assigned to you."
        }
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <button
                onClick={() => setView("table")}
                title="Table view"
                className={`p-2 ${view === "table" ? "bg-brand-600 text-white" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
              >
                <TableIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView("board")}
                title="Kanban board"
                className={`p-2 ${view === "board" ? "bg-brand-600 text-white" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
            <a
              href="/api/export?kind=tasks"
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
              title="Export CSV"
            >
              <Download className="w-4 h-4" /> CSV
            </a>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-3 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              New task
            </button>
          </div>
        }
      />

      <div className="flex flex-col lg:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-10 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex gap-1 overflow-auto thin-scroll">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap ${
                statusFilter === s
                  ? "bg-brand-600 text-white"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {STATUS_LABEL[s]} ({counts[s] || 0})
            </button>
          ))}
        </div>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
        >
          <option value="all">All priorities</option>
          <option value="high">High priority</option>
          <option value="medium">Medium priority</option>
          <option value="low">Low priority</option>
        </select>
        {isAdmin && users.length > 0 && (
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm max-w-[180px]"
          >
            <option value="all">All assignees</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </select>
        )}
        <input
          type="date"
          value={dueFrom}
          onChange={(e) => setDueFrom(e.target.value)}
          className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
          title="Due from"
        />
        <input
          type="date"
          value={dueTo}
          onChange={(e) => setDueTo(e.target.value)}
          className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
          title="Due to"
        />
      </div>

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : visible.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-12 text-center text-sm text-slate-500">
          No tasks match.
        </div>
      ) : view === "board" ? (
        <KanbanBoard
          tasks={visible}
          onMove={(t, status) => quickStatus(t, status)}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-xl shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-left text-slate-500">
              <tr>
                <Th>Task</Th>
                <Th>Assigned to</Th>
                <Th>Owner</Th>
                <Th>Priority</Th>
                <Th>Due date</Th>
                <Th>Status</Th>
                <Th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {visible.map((t) => {
                const overdue =
                  t.dueDate &&
                  t.status !== "done" &&
                  new Date(t.dueDate) < new Date();
                return (
                  <tr
                    key={t._id}
                    className="border-t border-slate-100 dark:border-slate-800"
                  >
                    <Td>
                      <Link
                        href={`/tasks/${t._id}`}
                        className="font-medium hover:text-brand-600"
                      >
                        {t.title}
                      </Link>
                      {t.project && (
                        <div className="text-xs text-slate-500 mt-0.5">
                          {t.project.name}
                        </div>
                      )}
                    </Td>
                    <Td>
                      {t.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <Avatar name={t.assignedTo.name} size={24} />
                          <span>{t.assignedTo.name}</span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td>
                      {t.createdBy ? (
                        <div className="flex items-center gap-2">
                          <Avatar name={t.createdBy.name} size={24} />
                          <span>{t.createdBy.name}</span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td>
                      <StatusBadge kind="priority" value={t.priority} />
                    </Td>
                    <Td>
                      {t.dueDate ? (
                        <span className={overdue ? "text-rose-600 font-medium" : ""}>
                          {new Date(t.dueDate).toLocaleDateString()}
                          {overdue && (
                            <span className="ml-1 text-xs">overdue</span>
                          )}
                        </span>
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td>
                      <select
                        value={t.status}
                        onChange={(e) => quickStatus(t, e.target.value)}
                        className="text-xs px-2 py-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded"
                      >
                        <option value="todo">Pending</option>
                        <option value="in_progress">In progress</option>
                        <option value="done">Completed</option>
                      </select>
                    </Td>
                    <Td>
                      <button
                        onClick={() => remove(t._id)}
                        className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title="New task" onClose={() => setShowForm(false)}>
          <form onSubmit={submit} className="space-y-3 text-sm">
            <input
              required
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
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
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
              >
                <option value="low">Low priority</option>
                <option value="medium">Medium priority</option>
                <option value="high">High priority</option>
              </select>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
              />
            </div>
            <select
              value={form.project}
              onChange={(e) => setForm({ ...form, project: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
            >
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
            {isAdmin && (
              <select
                value={form.assignedTo}
                onChange={(e) =>
                  setForm({ ...form, assignedTo: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
              >
                <option value="">Assign to me</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
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
                Create task
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

function Th({ children, className = "" }) {
  return (
    <th
      className={`px-4 py-3 font-medium text-xs uppercase tracking-wide ${className}`}
    >
      {children}
    </th>
  );
}
function Td({ children }) {
  return <td className="px-4 py-3 align-middle">{children}</td>;
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
