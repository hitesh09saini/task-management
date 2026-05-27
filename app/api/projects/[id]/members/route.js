import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { requireUser, isAdmin } from "@/lib/rbac";
import Project from "@/models/Project";
import "@/models/User";
import { notify } from "@/lib/notifications";

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function manageGuard(req, params) {
  const { user, error } = await requireUser();
  if (error) return { error };
  if (!isValidId(params.id))
    return { error: NextResponse.json({ error: "Invalid id" }, { status: 400 }) };
  await connectDB();
  const project = await Project.findById(params.id);
  if (!project)
    return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  const isCreator = String(project.createdBy) === user.sub;
  if (!isAdmin(user) && !isCreator)
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { user, project };
}

export async function POST(req, { params }) {
  const { user, project, error } = await manageGuard(req, params);
  if (error) return error;

  const { userId } = (await req.json()) || {};
  if (!isValidId(userId))
    return NextResponse.json({ error: "Invalid userId" }, { status: 400 });

  const updated = await Project.findByIdAndUpdate(
    project._id,
    { $addToSet: { members: userId } },
    { new: true }
  )
    .populate("members", "name email role")
    .populate("createdBy", "name email");

  await notify(userId, {
    type: "project_added",
    message: `You were added to project "${updated.name}"`,
    link: `/projects/${updated._id}`,
  });

  return NextResponse.json({ project: updated });
}

export async function DELETE(req, { params }) {
  const { project, error } = await manageGuard(req, params);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!isValidId(userId))
    return NextResponse.json({ error: "Invalid userId" }, { status: 400 });

  const updated = await Project.findByIdAndUpdate(
    project._id,
    { $pull: { members: userId } },
    { new: true }
  )
    .populate("members", "name email role")
    .populate("createdBy", "name email");

  return NextResponse.json({ project: updated });
}
