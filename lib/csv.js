// Tiny CSV helpers. Quotes fields that contain commas, quotes, or newlines.

function escape(v) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCSV(rows, columns) {
  const header = columns.map((c) => c.label).join(",");
  const lines = rows.map((r) =>
    columns.map((c) => escape(typeof c.value === "function" ? c.value(r) : r[c.key])).join(",")
  );
  return [header, ...lines].join("\n");
}

export function csvResponse(NextResponse, csv, filename) {
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
