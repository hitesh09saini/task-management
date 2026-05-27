import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { requireUser, isAdmin } from "@/lib/rbac";
import ActivityLog from "@/models/ActivityLog";
import "@/models/User";

export async function GET(req) {
  const { user, error } = await requireUser();
  if (error) return error;

  await connectDB();
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
  const taskId = searchParams.get("task");
  const projectId = searchParams.get("project");

  const query = {};
  if (taskId && mongoose.Types.ObjectId.isValid(taskId)) query.task = taskId;
  if (projectId && mongoose.Types.ObjectId.isValid(projectId))
    query.project = projectId;

  // Non-admins only see entries where they are the actor or it concerns
  // a project/task they're involved with. To keep it simple: when no
  // filter is provided, scope to actor === self for non-admins.
  if (!isAdmin(user) && !taskId && !projectId) {
    query.actor = user.sub;
  }

  const items = await ActivityLog.find(query)
    .populate("actor", "name email")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return NextResponse.json({ activities: items });
}
