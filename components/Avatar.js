function colorFor(name = "") {
  const palette = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-violet-500",
    "bg-cyan-500",
    "bg-fuchsia-500",
    "bg-orange-500",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

function initials(name = "") {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0])
      .join("")
      .toUpperCase() || "?"
  );
}

export default function Avatar({ name = "", size = 32, className = "" }) {
  const px = `${size}px`;
  return (
    <span
      title={name}
      style={{ width: px, height: px, fontSize: size * 0.4 }}
      className={`inline-flex items-center justify-center rounded-full text-white font-semibold ring-2 ring-white dark:ring-slate-900 ${colorFor(name)} ${className}`}
    >
      {initials(name)}
    </span>
  );
}
