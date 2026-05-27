import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireUser, isAdmin } from "@/lib/rbac";
import Task from "@/models/Task";
import Project from "@/models/Project";
import User from "@/models/User";

function escRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(req) {
  const { user, error } = await requireUser();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (q.length < 2)
    return NextResponse.json({ projects: [], tasks: [], users: [] });

  await connectDB();
  const re = new RegExp(escRegex(q), "i");

  const projectFilter = isAdmin(user)
    ? { name: re }
    : { name: re, $or: [{ createdBy: user.sub }, { members: user.sub }] };
  const taskFilter = isAdmin(user)
    ? { title: re }
    : {
        title: re,
        $or: [{ assignedTo: user.sub }, { createdBy: user.sub }],
      };
  const userFilterPromise = isAdmin(user)
    ? User.find({ $or: [{ name: re }, { email: re }] })
        .select("name email role")
        .limit(5)
        .lean()
    : Promise.resolve([]);

  const [projects, tasks, users] = await Promise.all([
    Project.find(projectFilter).select("name status").limit(5).lean(),
    Task.find(taskFilter)
      .select("title status priority")
      .limit(8)
      .lean(),
    userFilterPromise,
  ]);

  return NextResponse.json({ projects, tasks, users });
}
