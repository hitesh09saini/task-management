import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";
import "@/models/User";
import { requireUser, isAdmin } from "@/lib/rbac";
import { notify } from "@/lib/notifications";
import { logActivity } from "@/lib/activity";

function isValidId(id) {
  return id && mongoose.Types.ObjectId.isValid(id);
}

function canAccess(task, user) {
  if (isAdmin(user)) return true;
  return (
    String(task.assignedTo) === user.sub ||
    String(task.createdBy) === user.sub
  );
}

export async function POST(req, { params }) {
  const { user, error } = await requireUser();
  if (error) return error;
  if (!isValidId(params.id))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const { text } = (await req.json()) || {};
  if (!text || !text.trim())
    return NextResponse.json({ error: "Comment text required" }, { status: 400 });

  await connectDB();
  const task = await Task.findById(params.id);
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canAccess(task, user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  task.comments.push({
    author: user.sub,
    authorName: user.name || user.email,
    text: text.trim(),
  });
  await task.save();

  await logActivity({
    actor: user.sub,
    actorName: user.name,
    type: "task_commented",
    targetType: "task",
    targetId: task._id,
    targetName: task.title,
    message: `commented on "${task.title}"`,
    task: task._id,
    project: task.project,
  });

  const recipients = [String(task.assignedTo), String(task.createdBy)].filter(
    (id) => id && id !== user.sub
  );
  for (const r of recipients) {
    await notify(r, {
      type: "task_commented",
      message: `${user.name || "Someone"} commented on "${task.title}"`,
      link: `/tasks/${task._id}`,
    });
  }

  return NextResponse.json({ task });
}
