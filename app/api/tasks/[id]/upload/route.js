import { NextResponse } from "next/server";
import mongoose from "mongoose";
import path from "path";
import { writeFile, mkdir } from "fs/promises";
import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";
import { requireUser, isAdmin } from "@/lib/rbac";
import { logActivity } from "@/lib/activity";

export const runtime = "nodejs";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

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

function sanitize(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
}

export async function POST(req, { params }) {
  const { user, error } = await requireUser();
  if (error) return error;
  if (!isValidId(params.id))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  let formData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || typeof file === "string")
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  if (file.size > MAX_SIZE)
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });

  await connectDB();
  const task = await Task.findById(params.id);
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canAccess(task, user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const safeName = sanitize(file.name || "file");
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
  const filepath = path.join(uploadDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buffer);

  // File versioning: if an attachment with the same originalName exists, bump version
  const originalName = file.name || safeName;
  const sameName = (task.attachments || []).filter(
    (a) => a.originalName === originalName
  );
  const nextVersion = sameName.length
    ? Math.max(...sameName.map((a) => a.version || 1)) + 1
    : 1;

  task.attachments.push({
    filename,
    originalName,
    url: `/uploads/${filename}`,
    size: file.size,
    mimeType: file.type || "",
    version: nextVersion,
    uploadedBy: user.sub,
  });
  await task.save();

  await logActivity({
    actor: user.sub,
    actorName: user.name,
    type: "task_file_uploaded",
    targetType: "task",
    targetId: task._id,
    targetName: task.title,
    message: `uploaded "${originalName}" (v${nextVersion}) to "${task.title}"`,
    task: task._id,
    project: task.project,
    metadata: { filename, originalName, version: nextVersion },
  });

  return NextResponse.json({ task });
}
