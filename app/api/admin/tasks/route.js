import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";
import "@/models/User";
import "@/models/Project";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const u = await getCurrentUser();
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (u.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const tasks = await Task.find({})
    .populate("assignedTo", "name email role")
    .populate("createdBy", "name email role")
    .populate("project", "name status")
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json({ tasks });
}
