import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";
import "@/models/User";
import "@/models/Project";
import {
  requireUser,
  isAdmin,
  canEditTask,
  canDeleteTask,
} from "@/lib/rbac";
import { notify } from "@/lib/notifications";
import { logActivity } from "@/lib/activity";

function isValidId(id) {
  return id && mongoose.Types.ObjectId.isValid(id);
}

function canRead(user, task) {
  if (isAdmin(user)) return true;
  return (
    String(task.assignedTo?._id || task.assignedTo) === user.sub ||
    String(task.createdBy?._id || task.createdBy) === user.sub
  );
}

export async function GET(_req, { params }) {
  const { user, error } = await requireUser();
  if (error) return error;
  if (!isValidId(params.id))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  await connectDB();
  const task = await Task.findById(params.id)
    .populate("assignedTo", "name email role")
    .populate("createdBy", "name email role")
    .populate("project", "name status")
    .populate("blockedBy", "title status assignedTo")
    .populate("comments.author", "name email")
    .lean();
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canRead(user, task))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({ task });
}

export async function PUT(req, { params }) {
  const { user, error } = await requireUser();
  if (error) return error;
  if (!isValidId(params.id))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  await connectDB();
  const task = await Task.findById(params.id);
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canEditTask(user, task))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const userFields = [
    "title",
    "description",
    "status",
    "priority",
    "dueDate",
    "startDate",
  ];
  const adminFields = ["project", "assignedTo", "blockedBy"];
  const fields =
    isAdmin(user) || String(task.createdBy) === user.sub
      ? [...userFields, ...adminFields]
      : userFields;

  const prevAssignee = String(task.assignedTo);
  const prevStatus = task.status;

  for (const k of fields) {
    if (k in body) {
      if (k === "dueDate" || k === "startDate")
        task[k] = body[k] ? new Date(body[k]) : undefined;
      else if (k === "project" || k === "assignedTo")
        task[k] = body[k] || undefined;
      else if (k === "blockedBy")
        task[k] = Array.isArray(body[k]) ? body[k].filter(isValidId) : [];
      else task[k] = body[k];
    }
  }

  // Prevent marking done if blockers aren't done
  if (
    body.status === "done" &&
    Array.isArray(task.blockedBy) &&
    task.blockedBy.length
  ) {
    const blockers = await Task.find({
      _id: { $in: task.blockedBy },
      status: { $ne: "done" },
    }).select("title");
    if (blockers.length) {
      return NextResponse.json(
        {
          error: `Blocked: ${blockers.map((b) => `"${b.title}"`).join(", ")} must complete first`,
        },
        { status: 400 }
      );
    }
  }

  await task.save();

  if (String(task.assignedTo) !== prevAssignee && task.assignedTo) {
    await notify(task.assignedTo, {
      type: "task_assigned",
      message: `Task assigned to you: "${task.title}"`,
      link: `/tasks/${task._id}`,
    });
    await logActivity({
      actor: user.sub,
      actorName: user.name,
      type: "task_assigned",
      targetType: "task",
      targetId: task._id,
      targetName: task.title,
      message: `assigned task "${task.title}"`,
      task: task._id,
      project: task.project,
    });
  } else if (task.status !== prevStatus) {
    await logActivity({
      actor: user.sub,
      actorName: user.name,
      type: "task_status_changed",
      targetType: "task",
      targetId: task._id,
      targetName: task.title,
      message: `moved "${task.title}" to ${task.status.replace("_", " ")}`,
      task: task._id,
      project: task.project,
      metadata: { from: prevStatus, to: task.status },
    });
    if (String(task.createdBy) !== user.sub) {
      await notify(task.createdBy, {
        type: "task_updated",
        message: `Task "${task.title}" is now ${task.status.replace("_", " ")}`,
        link: `/tasks/${task._id}`,
      });
    }
  } else {
    await logActivity({
      actor: user.sub,
      actorName: user.name,
      type: "task_updated",
      targetType: "task",
      targetId: task._id,
      targetName: task.title,
      message: `updated task "${task.title}"`,
      task: task._id,
      project: task.project,
    });
  }

  return NextResponse.json({ task });
}

export async function DELETE(_req, { params }) {
  const { user, error } = await requireUser();
  if (error) return error;
  if (!isValidId(params.id))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  await connectDB();
  const task = await Task.findById(params.id);
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canDeleteTask(user, task))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await task.deleteOne();
    await logActivity({
      actor: user.sub,
      actorName: user.name,
      type: "task_deleted",
      targetType: "task",
      targetId: task._id,
      targetName: task.title,
      message: `deleted task "${task.title}"`,
      project: task.project,
    });
    // Clean up references in other tasks' blockedBy
    await Task.updateMany(
      { blockedBy: task._id },
      { $pull: { blockedBy: task._id } }
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("delete task error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
