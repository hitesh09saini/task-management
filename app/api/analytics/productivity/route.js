import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";
import { requireUser, isAdmin } from "@/lib/rbac";

// Returns tasks completed per day for the last N days.
// For non-admins, scoped to tasks assigned to them.
export async function GET(req) {
  const { user, error } = await requireUser();
  if (error) return error;

  await connectDB();
  const { searchParams } = new URL(req.url);
  const days = Math.min(parseInt(searchParams.get("days") || "14", 10), 90);

  const since = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000);
  since.setHours(0, 0, 0, 0);

  const match = {
    status: "done",
    updatedAt: { $gte: since },
  };
  if (!isAdmin(user)) {
    match.assignedTo = new mongoose.Types.ObjectId(user.sub);
  }

  const rows = await Task.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  const byDay = new Map(rows.map((r) => [r._id, r.count]));
  const series = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since.getTime() + i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    series.push({
      date: key,
      label: d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      completed: byDay.get(key) || 0,
    });
  }

  return NextResponse.json({ series });
}
