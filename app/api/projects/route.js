import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/rbac";
import Project from "@/models/Project";
import "@/models/User";
import { notifyMany } from "@/lib/notifications";
import { logActivity } from "@/lib/activity";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  await connectDB();

  const query =
    user.role === "admin"
      ? {}
      : { $or: [{ createdBy: user.sub }, { members: user.sub }] };

  const projects = await Project.find(query)
    .populate("createdBy", "name email")
    .populate("members", "name email role")
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json({ projects });
}

export async function POST(req) {
  const { user, error } = await requireUser();
  if (error) return error;

  const body = await req.json();
  const { name, description, status, deadline, members = [] } = body || {};
  if (!name || !name.trim())
    return NextResponse.json({ error: "Name is required" }, { status: 400 });

  await connectDB();

  // Creator is always implicitly a member
  const memberSet = new Set(members.map(String));
  memberSet.add(user.sub);

  const project = await Project.create({
    name: name.trim(),
    description: description || "",
    status: status || "planning",
    deadline: deadline || undefined,
    createdBy: user.sub,
    members: [...memberSet],
  });

  await logActivity({
    actor: user.sub,
    actorName: user.name,
    type: "project_created",
    targetType: "project",
    targetId: project._id,
    message: `created project "${project.name}"`,
    project: project._id,
  });

  const others = [...memberSet].filter((id) => id !== user.sub);
  if (others.length) {
    await notifyMany(others, {
      type: "project_added",
      message: `You were added to project "${project.name}"`,
      link: `/projects/${project._id}`,
    });
  }

  return NextResponse.json({ project }, { status: 201 });
}
