"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Paperclip,
  Send,
  Loader2,
  FileText,
  Lock,
  History,
  Plus,
  X,
} from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import Avatar from "@/components/Avatar";

export default function TaskDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [task, setTask] = useState(null);
  const [activity, setActivity] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [err, setErr] = useState("");
  const [showDepPicker, setShowDepPicker] = useState(false);
  const fileRef = useRef(null);

  async function load() {
    const [tRes, aRes] = await Promise.all([
      fetch(`/api/tasks/${id}`),
      fetch(`/api/activity?task=${id}&limit=15`),
    ]);
    if (tRes.status === 404 || tRes.status === 403) {
      router.push("/tasks");
      return;
    }
    const tData = await tRes.json();
    const aData = aRes.ok ? await aRes.json() : { activities: [] };
    setTask(tData.task);
    setActivity(aData.activities || []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, [id]);

  // Load picker candidates lazily
  useEffect(() => {
    if (!showDepPicker || !task) return;
    (async () => {
      const url = task.project?._id
        ? `/api/tasks?project=${task.project._id}&scope=all`
        : "/api/tasks?scope=all";
      const res = await fetch(url);
      const data = res.ok ? await res.json() : { tasks: [] };
      const blockedIds = new Set((task.blockedBy || []).map((b) => b._id));
      setCandidates(
        (data.tasks || []).filter(
          (t) => t._id !== task._id && !blockedIds.has(t._id)
        )
      );
    })();
  }, [showDepPicker, task]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const a of task?.attachments || []) {
      const key = a.originalName;
      const arr = map.get(key) || [];
      arr.push(a);
      map.set(key, arr);
    }
    return [...map.entries()].map(([name, versions]) => ({
      name,
      versions: versions.sort((a, b) => (b.version || 1) - (a.version || 1)),
    }));
  }, [task]);

  async function updateStatus(status) {
    setErr("");
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const d = await res.json();
      setErr(d.error || "Failed to update status");
    }
    load();
  }

  async function setBlockers(ids) {
    await fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blockedBy: ids }),
    });
    load();
  }

  async function addComment(e) {
    e.preventDefault();
    if (!comment.trim()) return;
    setPosting(true);
    const res = await fetch(`/api/tasks/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: comment }),
    });
    setPosting(false);
    if (res.ok) {
      setComment("");
      load();
    }
  }

  async function upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr("");
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/tasks/${id}/upload`, {
      method: "POST",
      body: fd,
    });
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    if (!res.ok) {
      const data = await res.json();
      setErr(data.error || "Upload failed");
      return;
    }
    load();
  }

  if (loading || !task) return <p className="text-slate-500">Loading...</p>;

  const isBlocked = (task.blockedBy || []).some((b) => b.status !== "done");

  return (
    <div>
      <Link
        href="/tasks"
        className="text-sm text-slate-500 hover:text-brand-600 inline-flex items-center gap-1 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> All tasks
      </Link>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-xl shadow-card p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-black">{task.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <StatusBadge kind="task" value={task.status} />
              <StatusBadge kind="priority" value={task.priority} />
              {task.project && (
                <Link
                  href={`/projects/${task.project._id}`}
                  className="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 hover:underline"
                >
                  {task.project.name}
                </Link>
              )}
              {task.dueDate && (
                <span className="text-xs text-slate-500">
                  Due {new Date(task.dueDate).toLocaleDateString()}
                </span>
              )}
              {isBlocked && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Blocked
                </span>
              )}
            </div>
            {task.description && (
              <p className="text-slate-700 dark:text-slate-300 mt-4 whitespace-pre-wrap">
                {task.description}
              </p>
            )}
            <div className="mt-5 flex flex-wrap gap-4 text-xs text-slate-500">
              {task.assignedTo && (
                <span className="flex items-center gap-2">
                  Assigned to
                  <Avatar name={task.assignedTo.name} size={20} />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {task.assignedTo.name}
                  </span>
                </span>
              )}
              {task.createdBy && (
                <span className="flex items-center gap-2">
                  Created by
                  <Avatar name={task.createdBy.name} size={20} />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {task.createdBy.name}
                  </span>
                </span>
              )}
            </div>
            {err && (
              <p className="mt-3 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                {err}
              </p>
            )}
          </div>
          <select
            value={task.status}
            onChange={(e) => updateStatus(e.target.value)}
            className="text-sm px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
          >
            <option value="todo">Pending</option>
            <option value="in_progress">In progress</option>
            <option value="done">Completed</option>
          </select>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <section className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-xl shadow-card p-5">
            <h2 className="font-semibold mb-4">
              Comments ({task.comments?.length || 0})
            </h2>
            <ul className="space-y-4 mb-4">
              {(task.comments || []).length === 0 && (
                <li className="text-sm text-slate-500 py-4 text-center">
                  No comments yet.
                </li>
              )}
              {(task.comments || []).map((c) => (
                <li key={c._id} className="flex gap-3">
                  <Avatar
                    name={c.author?.name || c.authorName || "?"}
                    size={32}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">
                        {c.author?.name || c.authorName || "User"}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(c.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap mt-0.5">
                      {c.text}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <form onSubmit={addComment} className="flex gap-2 items-start">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm h-20"
              />
              <button
                disabled={!comment.trim() || posting}
                className="px-3 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
              >
                {posting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-xl shadow-card p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <History className="w-4 h-4" /> Activity
            </h2>
            {activity.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">
                No activity yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {activity.map((a) => (
                  <li key={a._id} className="flex gap-3 text-sm">
                    <Avatar name={a.actor?.name || a.actorName} size={24} />
                    <div className="flex-1">
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
          </div>
        </section>

        <aside className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-xl shadow-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold flex items-center gap-2">
                <Lock className="w-4 h-4" /> Blocked by
              </h2>
              <button
                onClick={() => setShowDepPicker((s) => !s)}
                className="text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            {(task.blockedBy || []).length === 0 ? (
              <p className="text-sm text-slate-500">No dependencies.</p>
            ) : (
              <ul className="space-y-1.5">
                {task.blockedBy.map((b) => (
                  <li
                    key={b._id}
                    className="flex items-center justify-between gap-2 text-sm border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5"
                  >
                    <Link
                      href={`/tasks/${b._id}`}
                      className="hover:text-brand-600 truncate flex-1"
                    >
                      {b.title}
                    </Link>
                    <StatusBadge kind="task" value={b.status} />
                    <button
                      onClick={() =>
                        setBlockers(
                          task.blockedBy
                            .filter((x) => x._id !== b._id)
                            .map((x) => x._id)
                        )
                      }
                      className="p-1 rounded text-slate-400 hover:text-rose-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {showDepPicker && (
              <div className="mt-3 border-t border-slate-200 dark:border-slate-800 pt-3">
                <p className="text-xs text-slate-500 mb-2">
                  Select tasks to depend on:
                </p>
                <div className="max-h-48 overflow-auto thin-scroll space-y-1">
                  {candidates.length === 0 && (
                    <p className="text-xs text-slate-500">
                      No other tasks available.
                    </p>
                  )}
                  {candidates.map((c) => (
                    <button
                      key={c._id}
                      onClick={() => {
                        setBlockers([
                          ...(task.blockedBy || []).map((b) => b._id),
                          c._id,
                        ]);
                        setShowDepPicker(false);
                      }}
                      className="block w-full text-left px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 rounded"
                    >
                      <div className="font-medium truncate">{c.title}</div>
                      <div className="text-xs text-slate-500">
                        {c.status.replace("_", " ")}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-xl shadow-card p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Paperclip className="w-4 h-4" /> Attachments
            </h2>
            {grouped.length === 0 ? (
              <p className="text-sm text-slate-500 mb-3">No files yet.</p>
            ) : (
              <ul className="space-y-2 mb-3">
                {grouped.map((g) => {
                  const latest = g.versions[0];
                  const older = g.versions.slice(1);
                  return (
                    <li
                      key={g.name}
                      className="border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        <a
                          href={latest.url}
                          target="_blank"
                          rel="noopener"
                          className="text-brand-600 hover:underline truncate flex-1"
                        >
                          {g.name}
                        </a>
                        <span className="text-[10px] text-slate-500 shrink-0 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                          v{latest.version || 1}
                        </span>
                        <span className="text-xs text-slate-500 shrink-0">
                          {Math.round(latest.size / 1024)} KB
                        </span>
                      </div>
                      {older.length > 0 && (
                        <details className="mt-1.5">
                          <summary className="text-[11px] text-slate-500 cursor-pointer hover:text-slate-700">
                            {older.length} older version{older.length > 1 ? "s" : ""}
                          </summary>
                          <ul className="mt-1.5 pl-5 space-y-1">
                            {older.map((v) => (
                              <li
                                key={v._id || v.filename}
                                className="text-xs text-slate-500 flex items-center gap-2"
                              >
                                <a
                                  href={v.url}
                                  target="_blank"
                                  rel="noopener"
                                  className="hover:underline truncate flex-1"
                                >
                                  v{v.version || 1}
                                </a>
                                <span>
                                  {new Date(v.createdAt).toLocaleDateString()}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            <label className="block">
              <span className="block text-xs text-slate-500 mb-1">
                Add file (max 5MB) — same name = new version
              </span>
              <input
                ref={fileRef}
                type="file"
                onChange={upload}
                disabled={uploading}
                className="block w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
              />
            </label>
            {uploading && (
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Uploading...
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
