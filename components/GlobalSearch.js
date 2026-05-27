"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, FolderKanban, ListTodo, User as UserIcon } from "lucide-react";

export default function GlobalSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState({ projects: [], tasks: [], users: [] });
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!q || q.length < 2) {
      setResults({ projects: [], tasks: [], users: [] });
      return;
    }
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [q]);

  useEffect(() => {
    function onClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const hasResults =
    results.projects.length || results.tasks.length || results.users.length;

  return (
    <div ref={boxRef} className="relative w-full max-w-sm">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search projects, tasks, users..."
          className="bg-transparent outline-none flex-1 placeholder:text-slate-400"
        />
        {q && (
          <button
            onClick={() => {
              setQ("");
              setResults({ projects: [], tasks: [], users: [] });
            }}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            ✕
          </button>
        )}
      </div>
      {open && q.length >= 2 && (
        <div className="absolute mt-2 left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg overflow-hidden z-50 max-h-96 overflow-y-auto thin-scroll">
          {loading && (
            <p className="text-xs text-slate-500 p-3 text-center">
              Searching...
            </p>
          )}
          {!loading && !hasResults && (
            <p className="text-xs text-slate-500 p-3 text-center">
              No matches.
            </p>
          )}
          {results.projects.length > 0 && (
            <Group label="Projects">
              {results.projects.map((p) => (
                <Item
                  key={p._id}
                  href={`/projects/${p._id}`}
                  icon={FolderKanban}
                  title={p.name}
                  subtitle={p.status?.replace("_", " ")}
                  onClick={() => setOpen(false)}
                />
              ))}
            </Group>
          )}
          {results.tasks.length > 0 && (
            <Group label="Tasks">
              {results.tasks.map((t) => (
                <Item
                  key={t._id}
                  href={`/tasks/${t._id}`}
                  icon={ListTodo}
                  title={t.title}
                  subtitle={`${t.priority} priority · ${t.status.replace("_", " ")}`}
                  onClick={() => setOpen(false)}
                />
              ))}
            </Group>
          )}
          {results.users.length > 0 && (
            <Group label="Users">
              {results.users.map((u) => (
                <Item
                  key={u._id}
                  href="/team"
                  icon={UserIcon}
                  title={u.name}
                  subtitle={u.email}
                  onClick={() => setOpen(false)}
                />
              ))}
            </Group>
          )}
        </div>
      )}
    </div>
  );
}

function Group({ label, children }) {
  return (
    <div>
      <div className="px-3 py-1.5 text-[11px] uppercase tracking-wide text-slate-500 bg-slate-50 dark:bg-slate-800/50">
        {label}
      </div>
      {children}
    </div>
  );
}

function Item({ href, icon: Icon, title, subtitle, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm"
    >
      <span className="w-7 h-7 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
        <Icon className="w-4 h-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-medium truncate">{title}</div>
        {subtitle && (
          <div className="text-xs text-slate-500 truncate capitalize">
            {subtitle}
          </div>
        )}
      </div>
    </Link>
  );
}
