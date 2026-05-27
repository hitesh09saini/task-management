export default function ProgressBar({ value = 0, tone = "brand" }) {
  const v = Math.max(0, Math.min(100, value));
  const colors = {
    brand: "bg-brand-600",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
  };
  return (
    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${colors[tone] || colors.brand}`}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}
