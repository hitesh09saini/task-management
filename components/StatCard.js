export default function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "brand",
}) {
  const tones = {
    brand: "bg-brand-50 text-brand-600 dark:bg-brand-600/10 dark:text-brand-500",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    emerald:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
    slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  };
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800 shadow-card p-4 flex items-center gap-4">
      {Icon && (
        <span
          className={`w-11 h-11 rounded-lg flex items-center justify-center ${tones[tone]}`}
        >
          <Icon className="w-5 h-5" />
        </span>
      )}
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </div>
        <div className="text-2xl font-bold leading-tight">{value}</div>
        {hint && (
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {hint}
          </div>
        )}
      </div>
    </div>
  );
}
