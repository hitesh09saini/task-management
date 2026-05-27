import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";
import Project from "@/models/Project";
import "@/models/User";
import { requireUser, isAdmin } from "@/lib/rbac";
import { notify } from "@/lib/notifications";
import { logActivity } from "@/lib/activity";

function isValidId(id) {
  return id && mongoose.Types.ObjectId.isValid(id);
}

export async function GET(req) {
  const { user, error } = await requireUser();
  if (error) return error;

  await connectDB();
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("project");
  const scope = searchParams.get("scope"); // "assigned" | "created" | "all"
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const assignedTo = searchParams.get("assignedTo");
  const dueFrom = searchParams.get("dueFrom");
  const dueTo = searchParams.get("dueTo");

  const query = {};
  if (projectId && isValidId(projectId)) query.project = projectId;
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (assignedTo && isValidId(assignedTo)) query.assignedTo = assignedTo;
  if (dueFrom || dueTo) {
    query.dueDate = {};
    if (dueFrom) query.dueDate.$gte = new Date(dueFrom);
    if (dueTo) query.dueDate.$lte = new Date(dueTo);
  }

  if (isAdmin(user) && scope === "all") {
    // admin can list everything
  } else if (scope === "created") {
    query.createdBy = user.sub;
  } else if (!isAdmin(user)) {
    query.assignedTo = user.sub;
  }

  const tasks = await Task.find(query)
    .populate("assignedTo", "name email")
    .populate("createdBy", "name email")
    .populate("project", "name status")
    .populate("blockedBy", "title status")
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json({ tasks });
}

export async function POST(req) {
  const { user, error } = await requireUser();
  if (error) return error;

  try {
    const body = await req.json();
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      startDate,
      project,
      assignedTo,
      blockedBy,
    } = body || {};

    if (!title || !title.trim())
      return NextResponse.json({ error: "Title is required" }, { status: 400 });

    await connectDB();

    let assignee = user.sub;
    if (assignedTo && isValidId(assignedTo)) {
      if (!isAdmin(user) && assignedTo !== user.sub)
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      assignee = assignedTo;
    }

    let projectId;
    if (project && isValidId(project)) {
      const p = await Project.findById(project).lean();
      if (!p)
        return NextResponse.json({ error: "Project not found" }, { status: 400 });
      const isMember =
        String(p.createdBy) === user.sub ||
        (p.members || []).some((m) => String(m) === user.sub);
      if (!isAdmin(user) && !isMember)
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      projectId = p._id;
    }

    const task = await Task.create({
      title: title.trim(),
      description: description || "",
      status: status || "todo",
      priority: priority || "medium",
      dueDate: dueDate ? new Date(dueDate) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      project: projectId,
      assignedTo: assignee,
      createdBy: user.sub,
      blockedBy: Array.isArray(blockedBy)
        ? blockedBy.filter(isValidId)
        : [],
    });

    await logActivity({
      actor: user.sub,
      actorName: user.name,
      type: "task_created",
      targetType: "task",
      targetId: task._id,
      targetName: task.title,
      message: `created task "${task.title}"`,
      task: task._id,
      project: task.project,
    });

    if (String(assignee) !== user.sub) {
      await notify(assignee, {
        type: "task_assigned",
        message: `New task assigned: "${task.title}"`,
        link: `/tasks/${task._id}`,
      });
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch (err) {
    console.error("create task error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
