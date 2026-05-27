"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  UserPlus,
  Pencil,
  Trash2,
  ShieldCheck,
  ShieldOff,
  Loader2,
  X,
  Power,
  PowerOff,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Avatar from "@/components/Avatar";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "user",
};

export default function TeamPage() {
  const [me, setMe] = useState(null);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState(null); // {id, name}
  const [editName, setEditName] = useState("");
  const [actionErr, setActionErr] = useState("");

  async function load() {
    setLoading(true);
    const [meRes, uRes, tRes] = await Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/admin/users").then((r) => r.json()),
      fetch("/api/admin/tasks").then((r) => r.json()),
    ]);
    setMe(meRes.user || null);
    setUsers(uRes.users || []);
    setTasks(tRes.tasks || []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  const statsByUser = useMemo(() => {
    const m = new Map();
    for (const t of tasks) {
      const uid = t.assignedTo?._id;
      if (!uid) continue;
      const e = m.get(uid) || { total: 0, done: 0, pending: 0 };
      e.total += 1;
      if (t.status === "done") e.done += 1;
      else e.pending += 1;
      m.set(uid, e);
    }
    return m;
  }, [tasks]);

  const visible = useMemo(() => {
    const q = query.toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter === "active" && u.active === false) return false;
      if (statusFilter === "inactive" && u.active !== false) return false;
      if (
        q &&
        !u.name.toLowerCase().includes(q) &&
        !u.email.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [users, query, roleFilter, statusFilter]);

  async function createUser(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setErr(data.error || "Failed to create user");
      return;
    }
    setForm(emptyForm);
    setShowForm(false);
    load();
  }

  async function patchUser(id, patch) {
    setActionErr("");
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (!res.ok) {
      setActionErr(data.error || "Failed");
      return false;
    }
    load();
    return true;
  }

  async function deleteUser(u) {
    if (
      !confirm(
        `Delete ${u.name}? Their tasks will be reassigned to you and they'll be removed from all projects.`
      )
    )
      return;
    setActionErr("");
    const res = await fetch(`/api/admin/users/${u._id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setActionErr(data.error || "Failed");
      return;
    }
    load();
  }

  async function saveName(id) {
    if (!editName.trim()) return;
    const ok = await patchUser(id, { name: editName });
    if (ok) {
      setEditing(null);
      setEditName("");
    }
  }

  const myId = me?.id;
  const counts = useMemo(
    () => ({
      total: users.length,
      admins: users.filter((u) => u.role === "admin").length,
      active: users.filter((u) => u.active !== false).length,
      inactive: users.filter((u) => u.active === false).length,
    }),
    [users]
  );

  return (
    <div>
      <PageHeader
        title="Team Members"
        subtitle="Manage users, roles and access."
        actions={
          <div className="flex items-center gap-2">
            <a
              href="/api/export?kind=users"
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              CSV
            </a>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-3 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-medium"
            >
              <UserPlus className="w-4 h-4" /> New user
            </button>
          </div>
        }
      />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Mini label="Total" value={counts.total} />
        <Mini label="Admins" value={counts.admins} tone="brand" />
        <Mini label="Active" value={counts.active} tone="emerald" />
        <Mini label="Deactivated" value={counts.inactive} tone="rose" />
      </section>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
        >
          <option value="all">All roles</option>
          <option value="admin">Admins</option>
          <option value="user">Users</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Deactivated</option>
        </select>
      </div>

      {actionErr && (
        <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 mb-4">
          {actionErr}
        </p>
      )}

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : visible.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-12 text-center text-sm text-slate-500">
          No users match.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-xl shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-left text-slate-500">
              <tr>
                <Th>User</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Workload</Th>
                <Th>Joined</Th>
                <Th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {visible.map((u) => {
                const isMe = u._id === myId;
                const inactive = u.active === false;
                const s = statsByUser.get(u._id) || {
                  total: 0,
                  done: 0,
                  pending: 0,
                };
                return (
                  <tr
                    key={u._id}
                    className={`border-t border-slate-100 dark:border-slate-800 ${inactive ? "opacity-60" : ""}`}
                  >
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} size={36} />
                        <div className="min-w-0">
                          {editing?.id === u._id ? (
                            <div className="flex items-center gap-1">
                              <input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onKeyDown={(e) =>
                                  e.key === "Enter" && saveName(u._id)
                                }
                                autoFocus
                                className="px-2 py-1 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded"
                              />
                              <button
                                onClick={() => saveName(u._id)}
                                className="text-xs text-brand-600 hover:underline"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditing(null);
                                  setEditName("");
                                }}
                                className="text-xs text-slate-500 hover:underline"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="font-medium truncate flex items-center gap-2">
                              {u.name}
                              {isMe && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                  you
                                </span>
                              )}
                            </div>
                          )}
                          <div className="text-xs text-slate-500 truncate">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <select
                        value={u.role}
                        onChange={(e) =>
                          patchUser(u._id, { role: e.target.value })
                        }
                        disabled={isMe}
                        title={isMe ? "You can't change your own role" : ""}
                        className={`text-xs px-2 py-1 border rounded ${
                          u.role === "admin"
                            ? "border-brand-300 bg-brand-50 text-brand-700 dark:bg-brand-600/10 dark:border-brand-700 dark:text-brand-400"
                            : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                        } disabled:opacity-60 disabled:cursor-not-allowed`}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </Td>
                    <Td>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          inactive
                            ? "bg-rose-100 text-rose-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {inactive ? "Deactivated" : "Active"}
                      </span>
                    </Td>
                    <Td>
                      <span className="text-xs">
                        <span className="font-medium">{s.total}</span>{" "}
                        <span className="text-slate-500">
                          ({s.done} done, {s.pending} pending)
                        </span>
                      </span>
                    </Td>
                    <Td>
                      <span className="text-xs text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1 justify-end">
                        <IconBtn
                          title="Edit name"
                          onClick={() => {
                            setEditing({ id: u._id, name: u.name });
                            setEditName(u.name);
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </IconBtn>
                        <IconBtn
                          title={inactive ? "Reactivate" : "Deactivate"}
                          disabled={isMe}
                          onClick={() =>
                            patchUser(u._id, { active: !!inactive })
                          }
                        >
                          {inactive ? (
                            <Power className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <PowerOff className="w-3.5 h-3.5 text-amber-600" />
                          )}
                        </IconBtn>
                        <IconBtn
                          title="Delete user"
                          disabled={isMe}
                          onClick={() => deleteUser(u)}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        </IconBtn>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <PermissionsHint />

      {showForm && (
        <Modal title="Create new user" onClose={() => setShowForm(false)}>
          <form onSubmit={createUser} className="space-y-3 text-sm">
            <Field
              label="Full name"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              placeholder="Jane Doe"
            />
            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
              placeholder="jane@company.com"
            />
            <Field
              label="Temporary password (min 6 chars)"
              type="password"
              value={form.password}
              onChange={(v) => setForm({ ...form, password: v })}
              placeholder="••••••••"
            />
            <div>
              <p className="font-medium mb-1">Role</p>
              <div className="grid grid-cols-2 gap-2">
                <RoleOption
                  active={form.role === "user"}
                  onClick={() => setForm({ ...form, role: "user" })}
                  icon={ShieldOff}
                  label="User"
                  description="Standard team member"
                />
                <RoleOption
                  active={form.role === "admin"}
                  onClick={() => setForm({ ...form, role: "admin" })}
                  icon={ShieldCheck}
                  label="Admin"
                  description="Full access"
                />
              </div>
            </div>
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
                Create user
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
function IconBtn({ children, ...rest }) {
  return (
    <button
      {...rest}
      className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}
function Field({ label, type = "text", value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label}
      </span>
      <input
        required
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        minLength={type === "password" ? 6 : undefined}
        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
    </label>
  );
}
function RoleOption({ active, onClick, icon: Icon, label, description }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-3 rounded-lg border ${
        active
          ? "border-brand-500 bg-brand-50 dark:bg-brand-600/10"
          : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
      }`}
    >
      <Icon
        className={`w-4 h-4 mb-1 ${active ? "text-brand-600" : "text-slate-500"}`}
      />
      <div className="font-medium">{label}</div>
      <div className="text-xs text-slate-500">{description}</div>
    </button>
  );
}
function Mini({ label, value, tone = "slate" }) {
  const t = {
    slate: "bg-white border-slate-200 text-slate-900",
    brand:
      "bg-white border-brand-200 text-brand-700 dark:bg-slate-900 dark:border-brand-700/40 dark:text-brand-400",
    emerald:
      "bg-white border-emerald-200 text-emerald-700 dark:bg-slate-900 dark:border-emerald-800 dark:text-emerald-400",
    rose: "bg-white border-rose-200 text-rose-700 dark:bg-slate-900 dark:border-rose-800 dark:text-rose-400",
  }[tone];
  return (
    <div className={`rounded-xl border p-3 ${t}`}>
      <div className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function PermissionsHint() {
  return (
    <div className="mt-6 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-xl p-5 text-sm">
      <h3 className="font-semibold mb-3">Role permissions</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2 text-brand-700 dark:text-brand-400 font-medium">
            <ShieldCheck className="w-4 h-4" /> Admin
          </div>
          <ul className="space-y-1 text-slate-600 dark:text-slate-400">
            <Perm>Create, edit and delete any project or task</Perm>
            <Perm>Assign tasks to any user</Perm>
            <Perm>Manage team members (create, edit, deactivate, delete)</Perm>
            <Perm>View reports and analytics</Perm>
            <Perm>See all activity across the system</Perm>
          </ul>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2 text-slate-700 dark:text-slate-300 font-medium">
            <ShieldOff className="w-4 h-4" /> User
          </div>
          <ul className="space-y-1 text-slate-600 dark:text-slate-400">
            <Perm>Create projects (becomes member &amp; manager of them)</Perm>
            <Perm>Manage tasks they own or are assigned to</Perm>
            <Perm>Comment on and upload files to accessible tasks</Perm>
            <Perm>Update status of assigned tasks</Perm>
            <Perm>View only projects they belong to</Perm>
          </ul>
        </div>
      </div>
    </div>
  );
}
function Perm({ children }) {
  return (
    <li className="flex items-start gap-2">
      <span className="w-1 h-1 mt-2 rounded-full bg-emerald-500 shrink-0" />
      <span>{children}</span>
    </li>
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
