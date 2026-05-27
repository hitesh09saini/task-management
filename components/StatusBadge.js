const TASK_STATUS = {
  todo: { label: "Pending", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  in_progress: { label: "In progress", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  done: { label: "Completed", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
};

const PRIORITY = {
  low: { label: "Low", cls: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  medium: { label: "Medium", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  high: { label: "High", cls: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300" },
};

const PROJECT = {
  planning: { label: "Planning", cls: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  active: { label: "Active", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  on_hold: { label: "On hold", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  completed: { label: "Completed", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  archived: { label: "Archived", cls: "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
};

const MAPS = { task: TASK_STATUS, priority: PRIORITY, project: PROJECT };

export default function StatusBadge({ kind = "task", value }) {
  const map = MAPS[kind] || {};
  const item = map[value] || { label: value, cls: "bg-slate-100 text-slate-700" };
  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${item.cls}`}
    >
      {item.label}
    </span>
  );
}
