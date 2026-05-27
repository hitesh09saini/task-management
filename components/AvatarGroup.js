import Avatar from "./Avatar";

export default function AvatarGroup({ users = [], max = 4, size = 28 }) {
  const shown = users.slice(0, max);
  const rest = users.length - shown.length;
  return (
    <div className="flex items-center -space-x-2">
      {shown.map((u, i) => (
        <Avatar key={u._id || i} name={u.name || u.email || ""} size={size} />
      ))}
      {rest > 0 && (
        <span
          style={{ width: size, height: size, fontSize: size * 0.38 }}
          className="inline-flex items-center justify-center rounded-full bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 ring-2 ring-white dark:ring-slate-900 font-semibold"
        >
          +{rest}
        </span>
      )}
    </div>
  );
}
