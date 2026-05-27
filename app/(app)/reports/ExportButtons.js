"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";

export default function ExportButtons({ stats }) {
  const [busy, setBusy] = useState("");

  async function exportPDF() {
    setBusy("pdf");
    try {
      const [{ jsPDF }, autoTableMod] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const doc = new jsPDF();
      const autoTable = autoTableMod.default || autoTableMod.autoTable;

      doc.setFontSize(18);
      doc.text("Smart PMS — System Report", 14, 18);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(
        `Generated ${new Date().toLocaleString()}`,
        14,
        25
      );

      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text("Overview", 14, 38);
      autoTable(doc, {
        startY: 42,
        head: [["Metric", "Value"]],
        body: [
          ["Users", String(stats.userCount)],
          ["Admins", String(stats.adminCount)],
          ["Projects", String(stats.projectCount)],
          ["Tasks", String(stats.taskCount)],
          ["Tasks due this week", String(stats.upcoming)],
          ["Overdue tasks", String(stats.overdue)],
        ],
        theme: "striped",
        headStyles: { fillColor: [37, 99, 235] },
      });

      const after1 = doc.lastAutoTable.finalY + 8;
      doc.text("Tasks by status", 14, after1);
      autoTable(doc, {
        startY: after1 + 4,
        head: [["Status", "Count"]],
        body: [
          ["Pending", String(stats.taskStatus.todo)],
          ["In progress", String(stats.taskStatus.in_progress)],
          ["Completed", String(stats.taskStatus.done)],
        ],
        theme: "striped",
        headStyles: { fillColor: [37, 99, 235] },
      });

      const after2 = doc.lastAutoTable.finalY + 8;
      doc.text("Top assignees", 14, after2);
      autoTable(doc, {
        startY: after2 + 4,
        head: [["Name", "Email", "Tasks"]],
        body: (stats.perAssignee || []).map((a) => [
          a.name || "—",
          a.email || "",
          String(a.count),
        ]),
        theme: "striped",
        headStyles: { fillColor: [37, 99, 235] },
      });

      doc.save("smart-pms-report.pdf");
    } finally {
      setBusy("");
    }
  }

  async function exportExcel() {
    setBusy("xlsx");
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();

      const overview = [
        ["Metric", "Value"],
        ["Users", stats.userCount],
        ["Admins", stats.adminCount],
        ["Projects", stats.projectCount],
        ["Tasks", stats.taskCount],
        ["Tasks due this week", stats.upcoming],
        ["Overdue tasks", stats.overdue],
      ];
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.aoa_to_sheet(overview),
        "Overview"
      );

      const statusRows = [
        ["Status", "Count"],
        ["Pending", stats.taskStatus.todo],
        ["In progress", stats.taskStatus.in_progress],
        ["Completed", stats.taskStatus.done],
      ];
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.aoa_to_sheet(statusRows),
        "Tasks by status"
      );

      const priorityRows = [
        ["Priority", "Count"],
        ["High", stats.taskPriority.high],
        ["Medium", stats.taskPriority.medium],
        ["Low", stats.taskPriority.low],
      ];
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.aoa_to_sheet(priorityRows),
        "Tasks by priority"
      );

      const assigneeRows = [
        ["Name", "Email", "Tasks"],
        ...(stats.perAssignee || []).map((a) => [
          a.name || "",
          a.email || "",
          a.count,
        ]),
      ];
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.aoa_to_sheet(assigneeRows),
        "Top assignees"
      );

      XLSX.writeFile(wb, "smart-pms-report.xlsx");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={exportPDF}
        disabled={!!busy}
        className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
      >
        {busy === "pdf" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
        PDF
      </button>
      <button
        onClick={exportExcel}
        disabled={!!busy}
        className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
      >
        {busy === "xlsx" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="w-4 h-4" />
        )}
        Excel
      </button>
      <a
        href="/api/export?kind=tasks"
        className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
      >
        <Download className="w-4 h-4" /> CSV
      </a>
    </div>
  );
}
