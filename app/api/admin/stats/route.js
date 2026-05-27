import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";
import Project from "@/models/Project";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const u = await getCurrentUser();
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (u.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();

  const [
    userCount,
    adminCount,
    projectCount,
    taskCount,
    taskStatus,
    taskPriority,
    projectStatus,
    perAssignee,
    upcoming,
    overdue,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: "admin" }),
    Project.countDocuments({}),
    Task.countDocuments({}),
    Task.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Task.aggregate([{ $group: { _id: "$priority", count: { $sum: 1 } } }]),
    Project.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Task.aggregate([
      { $group: { _id: "$assignedTo", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          count: 1,
          name: "$user.name",
          email: "$user.email",
        },
      },
    ]),
    Task.countDocuments({
      status: { $ne: "done" },
      dueDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    }),
    Task.countDocuments({
      status: { $ne: "done" },
      dueDate: { $lt: new Date() },
    }),
  ]);

  const fold = (rows, keys) => {
    const out = Object.fromEntries(keys.map((k) => [k, 0]));
    rows.forEach((r) => {
      if (r._id) out[r._id] = r.count;
    });
    return out;
  };

  return NextResponse.json({
    userCount,
    adminCount,
    projectCount,
    taskCount,
    taskStatus: fold(taskStatus, ["todo", "in_progress", "done"]),
    taskPriority: fold(taskPriority, ["low", "medium", "high"]),
    projectStatus: fold(projectStatus, [
      "planning",
      "active",
      "on_hold",
      "completed",
      "archived",
    ]),
    perAssignee,
    upcoming,
    overdue,
  });
}
