import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireUser, isAdmin } from "@/lib/rbac";
import Task from "@/models/Task";
import Project from "@/models/Project";
import User from "@/models/User";
import { toCSV, csvResponse } from "@/lib/csv";

export async function GET(req) {
  const { user, error } = await requireUser();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const kind = searchParams.get("kind") || "tasks";

  await connectDB();

  if (kind === "tasks") {
    const filter = isAdmin(user) ? {} : { assignedTo: user.sub };
    const tasks = await Task.find(filter)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("project", "name")
      .lean();
    const csv = toCSV(tasks, [
      { label: "Title", value: (t) => t.title },
      { label: "Description", value: (t) => t.description || "" },
      { label: "Project", value: (t) => t.project?.name || "" },
      { label: "Status", value: (t) => t.status },
      { label: "Priority", value: (t) => t.priority },
      {
        label: "Assigned To",
        value: (t) => t.assignedTo?.name || "",
      },
      { label: "Created By", value: (t) => t.createdBy?.name || "" },
      {
        label: "Due Date",
        value: (t) =>
          t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 10) : "",
      },
      {
        label: "Created",
        value: (t) =>
          t.createdAt ? new Date(t.createdAt).toISOString() : "",
      },
    ]);
    return csvResponse(NextResponse, csv, "tasks.csv");
  }

  if (kind === "projects") {
    const filter = isAdmin(user)
      ? {}
      : { $or: [{ createdBy: user.sub }, { members: user.sub }] };
    const projects = await Project.find(filter)
      .populate("createdBy", "name")
      .populate("members", "name")
      .lean();
    const csv = toCSV(projects, [
      { label: "Name", value: (p) => p.name },
      { label: "Description", value: (p) => p.description || "" },
      { label: "Status", value: (p) => p.status },
      { label: "Created By", value: (p) => p.createdBy?.name || "" },
      {
        label: "Members",
        value: (p) =>
          (p.members || []).map((m) => m.name).join("; "),
      },
      {
        label: "Deadline",
        value: (p) =>
          p.deadline ? new Date(p.deadline).toISOString().slice(0, 10) : "",
      },
    ]);
    return csvResponse(NextResponse, csv, "projects.csv");
  }

  if (kind === "users") {
    if (!isAdmin(user))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const users = await User.find({}).select("-passwordHash").lean();
    const csv = toCSV(users, [
      { label: "Name", value: (u) => u.name },
      { label: "Email", value: (u) => u.email },
      { label: "Role", value: (u) => u.role },
      {
        label: "Joined",
        value: (u) =>
          u.createdAt ? new Date(u.createdAt).toISOString().slice(0, 10) : "",
      },
    ]);
    return csvResponse(NextResponse, csv, "users.csv");
  }

  return NextResponse.json({ error: "Unknown kind" }, { status: 400 });
}
