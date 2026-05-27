import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Task from "@/models/Task";
import Project from "@/models/Project";
import Notification from "@/models/Notification";
import { requireAdmin } from "@/lib/rbac";
import { logActivity } from "@/lib/activity";

function isValidId(id) {
  return id && mongoose.Types.ObjectId.isValid(id);
}

async function adminCount() {
  return User.countDocuments({ role: "admin", active: { $ne: false } });
}

export async function PUT(req, { params }) {
  const { user, error } = await requireAdmin();
  if (error) return error;
  if (!isValidId(params.id))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  await connectDB();
  const target = await User.findById(params.id);
  if (!target)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = (await req.json()) || {};
  const updates = {};
  const isSelf = String(target._id) === user.sub;

  if (typeof body.name === "string") {
    const n = body.name.trim();
    if (!n)
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    updates.name = n;
  }

  if (body.role && (body.role === "admin" || body.role === "user")) {
    if (isSelf && body.role !== target.role)
      return NextResponse.json(
        { error: "You cannot change your own role" },
        { status: 400 }
      );
    if (
      target.role === "admin" &&
      body.role === "user" &&
      (await adminCount()) <= 1
    )
      return NextResponse.json(
        { error: "At least one admin must remain" },
        { status: 400 }
      );
    updates.role = body.role;
  }

  if (typeof body.active === "boolean") {
    if (isSelf && body.active === false)
      return NextResponse.json(
        { error: "You cannot deactivate yourself" },
        { status: 400 }
      );
    if (
      target.role === "admin" &&
      target.active !== false &&
      body.active === false &&
      (await adminCount()) <= 1
    )
      return NextResponse.json(
        { error: "At least one active admin must remain" },
        { status: 400 }
      );
    updates.active = body.active;
  }

  if (Object.keys(updates).length === 0)
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const updated = await User.findByIdAndUpdate(target._id, updates, {
    new: true,
  }).select("-passwordHash");

  const changes = Object.keys(updates).join(", ");
  await logActivity({
    actor: user.sub,
    actorName: user.name,
    type: "user_updated",
    targetType: "user",
    targetId: updated._id,
    targetName: updated.name,
    message: `updated ${changes} on user "${updated.name}"`,
    metadata: updates,
  });

  return NextResponse.json({ user: updated });
}

export async function DELETE(_req, { params }) {
  const { user, error } = await requireAdmin();
  if (error) return error;
  if (!isValidId(params.id))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  await connectDB();
  const target = await User.findById(params.id);
  if (!target)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (String(target._id) === user.sub)
    return NextResponse.json(
      { error: "You cannot delete your own account" },
      { status: 400 }
    );

  if (
    target.role === "admin" &&
    target.active !== false &&
    (await adminCount()) <= 1
  )
    return NextResponse.json(
      { error: "At least one admin must remain" },
      { status: 400 }
    );

  // Cleanup: reassign owned/assigned tasks to the actor (current admin)
  await Task.updateMany(
    { assignedTo: target._id },
    { $set: { assignedTo: user.sub } }
  );
  await Task.updateMany(
    { createdBy: target._id },
    { $set: { createdBy: user.sub } }
  );
  // Remove from project memberships, reassign created projects
  await Project.updateMany(
    { members: target._id },
    { $pull: { members: target._id } }
  );
  await Project.updateMany(
    { createdBy: target._id },
    { $set: { createdBy: user.sub } }
  );
  // Drop their notifications
  await Notification.deleteMany({ user: target._id });

  await target.deleteOne();

  await logActivity({
    actor: user.sub,
    actorName: user.name,
    type: "user_deleted",
    targetType: "user",
    targetId: target._id,
    targetName: target.name,
    message: `deleted user "${target.name}" (${target.email})`,
  });

  return NextResponse.json({ ok: true });
}
