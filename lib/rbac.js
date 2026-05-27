import { NextResponse } from "next/server";
import { getCurrentUser } from "./auth";

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}
export function forbidden(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) return { error: unauthorized() };
  return { user };
}

export async function requireAdmin() {
  const { user, error } = await requireUser();
  if (error) return { error };
  if (user.role !== "admin") return { error: forbidden() };
  return { user };
}

export function isAdmin(user) {
  return user?.role === "admin";
}

export function isProjectMember(user, project) {
  if (!user || !project) return false;
  if (isAdmin(user)) return true;
  const creator = String(project.createdBy?._id || project.createdBy);
  if (creator === user.sub) return true;
  return (project.members || []).some(
    (m) => String(m?._id || m) === user.sub
  );
}

export function canEditTask(user, task) {
  if (!user || !task) return false;
  if (isAdmin(user)) return true;
  return (
    String(task.assignedTo?._id || task.assignedTo) === user.sub ||
    String(task.createdBy?._id || task.createdBy) === user.sub
  );
}

export function canDeleteTask(user, task) {
  if (!user || !task) return false;
  if (isAdmin(user)) return true;
  return String(task.createdBy?._id || task.createdBy) === user.sub;
}
