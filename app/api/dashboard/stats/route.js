import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";
import Project from "@/models/Project";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const userId = new mongoose.Types.ObjectId(user.sub);

  const [byStatus, byPriority, projectCount, upcoming, overdue] =
    await Promise.all([
      Task.aggregate([
        { $match: { assignedTo: userId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: { assignedTo: userId } },
        { $group: { _id: "$priority", count: { $sum: 1 } } },
      ]),
      Project.countDocuments({
        $or: [{ createdBy: userId }, { members: userId }],
      }),
      Task.countDocuments({
        assignedTo: userId,
        status: { $ne: "done" },
        dueDate: {
          $gte: new Date(),
          $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
      Task.countDocuments({
        assignedTo: userId,
        status: { $ne: "done" },
        dueDate: { $lt: new Date() },
      }),
    ]);

  const status = { todo: 0, in_progress: 0, done: 0 };
  byStatus.forEach((r) => (status[r._id] = r.count));
  const priority = { low: 0, medium: 0, high: 0 };
  byPriority.forEach((r) => (priority[r._id] = r.count));

  return NextResponse.json({
    totalTasks: status.todo + status.in_progress + status.done,
    pendingTasks: status.todo + status.in_progress,
    completedTasks: status.done,
    status,
    priority,
    projectCount,
    upcoming,
    overdue,
  });
}
