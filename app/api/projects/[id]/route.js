import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { requireUser, isAdmin, isProjectMember } from "@/lib/rbac";
import Project from "@/models/Project";
import Task from "@/models/Task";
import "@/models/User";
import { notifyMany } from "@/lib/notifications";
import { logActivity } from "@/lib/activity";

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function loadProject(id) {
  return Project.findById(id)
    .populate("createdBy", "name email")
    .populate("members", "name email role")
    .lean();
}

function canManage(user, project) {
  if (isAdmin(user)) return true;
  return String(project.createdBy?._id || project.createdBy) === user.sub;
}

export async function GET(_req, { params }) {
  const { user, error } = await requireUser();
  if (error) return error;
  if (!isValidId(params.id))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  await connectDB();
  const project = await loadProject(params.id);
  if (!project)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isProjectMember(user, project))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tasks = await Task.find({ project: project._id })
    .populate("assignedTo", "name email")
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ project, tasks });
}

export async function PUT(req, { params }) {
  const { user, error } = await requireUser();
  if (error) return error;
  if (!isValidId(params.id))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  await connectDB();
  const existing = await Project.findById(params.id).lean();
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canManage(user, existing))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const updates = {};
  for (const k of ["name", "description", "status", "deadline", "members"]) {
    if (k in body) updates[k] = body[k];
  }

  const project = await Project.findByIdAndUpdate(params.id, updates, {
    new: true,
  })
    .populate("createdBy", "name email")
    .populate("members", "name email role");

  await logActivity({
    actor: user.sub,
    actorName: user.name,
    type: "project_updated",
    targetType: "project",
    targetId: project._id,
    message: `updated project "${project.name}"`,
    project: project._id,
  });

  if (Array.isArray(updates.members)) {
    const before = new Set((existing.members || []).map(String));
    const added = updates.members.filter((m) => !before.has(String(m)));
    if (added.length) {
      await notifyMany(added, {
        type: "project_added",
        message: `You were added to project "${project.name}"`,
        link: `/projects/${project._id}`,
      });
    }
  }

  return NextResponse.json({ project });
}

export async function DELETE(_req, { params }) {
  const { user, error } = await requireUser();
  if (error) return error;
  if (!isValidId(params.id))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  await connectDB();
  const project = await Project.findById(params.id);
  if (!project)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canManage(user, project))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await Task.updateMany({ project: project._id }, { $unset: { project: "" } });
  await project.deleteOne();

  await logActivity({
    actor: user.sub,
    actorName: user.name,
    type: "project_deleted",
    targetType: "project",
    targetId: project._id,
    message: `deleted project "${project.name}"`,
  });

  return NextResponse.json({ ok: true });
}
