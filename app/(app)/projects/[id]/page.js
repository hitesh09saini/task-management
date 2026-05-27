"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Plus,
  Trash2,
  UserPlus,
  Pencil,
  Loader2,
  X,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import ProgressBar from "@/components/ProgressBar";
import Avatar from "@/components/Avatar";
import GanttView from "./GanttView";
import { GanttChartSquare, Table as TableIcon } from "lucide-react";

const emptyTask = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  dueDate: "",
  assignedTo: "",
};

export default function ProjectDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskForm, setTaskForm] = useState(emptyTask);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState(false);
  const [pForm, setPForm] = useState(null);
  const [view, setView] = useState("table"); // "table" | "gantt"

  async function load() {
    setLoading(true);
    const meRes = await fetch("/api/auth/me");
    const u = meRes.ok ? (await meRes.json()).user : null;
    setMe(u);

    const [pRes, uRes] = await Promise.all([
      fetch(`/api/projects/${id}`),
      u?.role === "admin"
        ? fetch("/api/admin/users").then((r) => r.json())
        : Promise.resolve({ users: [] }),
    ]);
    if (!pRes.ok) {
      router.push("/projects");
      return;
    }
    const p = await pRes.json();
    setProject(p.project);
    setTasks(p.tasks || []);
    setAllUsers(uRes.users || []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, [id]);

  const isAdmin = me?.role === "admin";
  const isCreator =
    project && me && String(project.createdBy?._id || project.createdBy) === me.id;
  const canManage = isAdmin || isCreator;

  const progress = useMemo(() => {
    if (!tasks.length) return { pct: 0, done: 0, total: 0 };
    const done = tasks.filter((t) => t.status === "done").length;
    return { pct: (done / tasks.length) * 100, done, total: tasks.length };
  }, [tasks]);

  async function addTask(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...taskForm, project: id }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setErr(data.error || "Failed");
      return;
    }
    setTaskForm(emptyTask);
    setShowTaskForm(false);
    load();
  }

  async function addMember(userId) {
    if (!userId) return;
    await fetch(`/api/projects/${id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    load();
  }
  async function removeMember(userId) {
    await fetch(`/api/projects/${id}/members?userId=${userId}`, {
      method: "DELETE",
    });
    load();
  }
  async function saveProject(e) {
    e.preventDefault();
    setBusy(true);
    await fetch(`/api/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pForm),
    });
    setBusy(false);
    setEditing(false);
    load();
  }
  async function deleteTask(tid) {
    if (!confirm("Delete task?")) return;
    await fetch(`/api/tasks/${tid}`, { method: "DELETE" });
    load();
  }
  async function deleteProject() {
    if (!confirm("Delete this project? Tasks will be unlinked.")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    router.push("/projects");
  }

  if (loading || !project)
    return <p className="text-slate-500">Loading...</p>;

  const memberIds = new Set((project.members || []).map((m) => m._id));
  const nonMembers = allUsers.filter((u) => !memberIds.has(u._id));

  return (
    <div>
      <Link
        href="/projects"
        className="text-sm text-slate-500 hover:text-brand-600 inline-flex items-center gap-1 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> All projects
      </Link>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-xl shadow-card p-6 mb-6">
        {editing ? (
          <form onSubmit={saveProject} className="space-y-3 text-sm">
            <input
              value={pForm.name}
              onChange={(e) => setPForm({ ...pForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-lg font-semibold"
            />
            <textarea
              value={pForm.description || ""}
              onChange={(e) =>
                setPForm({ ...pForm, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg h-24"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={pForm.status}
                onChange={(e) => setPForm({ ...pForm, status: e.target.value })}
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
                value={pForm.deadline ? pForm.deadline.slice(0, 10) : ""}
                onChange={(e) => setPForm({ ...pForm, deadline: e.target.value })}
                className="px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
              />
            </div>
            <div className="flex gap-2">
              <button
                disabled={busy}
                className="px-3 py-2 bg-brand-600 text-white rounded-lg flex items-center gap-2"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-black">
                  {project.name}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                  <StatusBadge kind="project" value={project.status} />
                  {project.deadline && (
                    <span className="text-slate-500 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(project.deadline).toLocaleDateString()}
                    </span>
                  )}
                  <span className="text-slate-500">
                    {project.members?.length || 0} members
                  </span>
                </div>
                {project.description && (
                  <p className="text-slate-600 dark:text-slate-300 mt-4 max-w-2xl">
                    {project.description}
                  </p>
                )}
              </div>
              {canManage && (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setPForm({
                        name: project.name,
                        description: project.description,
                        status: project.status,
                        deadline: project.deadline,
                      });
                      setEditing(true);
                    }}
                    className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={deleteProject}
                    className="p-2 border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                <span>Overall progress</span>
                <span className="font-medium">
                  {progress.done}/{progress.total} tasks done
                </span>
              </div>
              <ProgressBar
                value={progress.pct}
                tone={progress.pct === 100 ? "emerald" : "brand"}
              />
            </div>
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-xl shadow-card p-5">
          <h2 className="font-semibold mb-3">Team members</h2>
          {project.members?.length ? (
            <ul className="space-y-2 mb-3">
              {project.members.map((m) => (
                <li
                  key={m._id}
                  className="flex items-center gap-3 text-sm"
                >
                  <Avatar name={m.name} size={32} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{m.name}</div>
                    <div className="text-xs text-slate-500 truncate">
                      {m.email}
                    </div>
                  </div>
                  {canManage && (
                    <button
                      onClick={() => removeMember(m._id)}
                      className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500 mb-3">No members yet.</p>
          )}
          {isAdmin && nonMembers.length > 0 && (
            <div className="relative">
              <UserPlus className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                onChange={(e) => {
                  addMember(e.target.value);
                  e.target.value = "";
                }}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm appearance-none"
              >
                <option value="">Add member...</option>
                {nonMembers.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-xl shadow-card overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <h2 className="font-semibold">Tasks ({tasks.length})</h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                <button
                  onClick={() => setView("table")}
                  className={`p-1.5 ${view === "table" ? "bg-brand-600 text-white" : "text-slate-500"}`}
                  title="Table"
                >
                  <TableIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setView("gantt")}
                  className={`p-1.5 ${view === "gantt" ? "bg-brand-600 text-white" : "text-slate-500"}`}
                  title="Timeline"
                >
                  <GanttChartSquare className="w-4 h-4" />
                </button>
              </div>
              {canManage && (
                <button
                  onClick={() => setShowTaskForm(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700"
                >
                  <Plus className="w-4 h-4" /> Add task
                </button>
              )}
            </div>
          </div>
          {tasks.length === 0 ? (
            <p className="p-8 text-sm text-slate-500 text-center">
              No tasks yet.
            </p>
          ) : view === "gantt" ? (
            <div className="p-5">
              <GanttView tasks={tasks} project={project} />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-left text-slate-500">
                <tr>
                  <Th>Title</Th>
                  <Th>Assigned</Th>
                  <Th>Owner</Th>
                  <Th>Status</Th>
                  <Th>Priority</Th>
                  <Th>Due</Th>
                  <Th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
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
                      <StatusBadge kind="task" value={t.status} />
                    </Td>
                    <Td>
                      <StatusBadge kind="priority" value={t.priority} />
                    </Td>
                    <Td>
                      {t.dueDate
                        ? new Date(t.dueDate).toLocaleDateString()
                        : "—"}
                    </Td>
                    <Td>
                      {canManage && (
                        <button
                          onClick={() => deleteTask(t._id)}
                          className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showTaskForm && (
        <Modal title="Add task" onClose={() => setShowTaskForm(false)}>
          <form onSubmit={addTask} className="space-y-3 text-sm">
            <input
              required
              placeholder="Title"
              value={taskForm.title}
              onChange={(e) =>
                setTaskForm({ ...taskForm, title: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
            />
            <textarea
              placeholder="Description"
              value={taskForm.description}
              onChange={(e) =>
                setTaskForm({ ...taskForm, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg h-20"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={taskForm.priority}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, priority: e.target.value })
                }
                className="px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
              >
                <option value="low">Low priority</option>
                <option value="medium">Medium priority</option>
                <option value="high">High priority</option>
              </select>
              <input
                type="date"
                value={taskForm.dueDate}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, dueDate: e.target.value })
                }
                className="px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
              />
            </div>
            <select
              required
              value={taskForm.assignedTo}
              onChange={(e) =>
                setTaskForm({ ...taskForm, assignedTo: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
            >
              <option value="">Assign to...</option>
              {allUsers.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
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
                onClick={() => setShowTaskForm(false)}
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
    <th className={`px-4 py-3 font-medium text-xs uppercase tracking-wide ${className}`}>
      {children}
    </th>
  );
}
function Td({ children, className = "" }) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
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
