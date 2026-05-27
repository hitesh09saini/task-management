import ActivityLog from "@/models/ActivityLog";

export async function logActivity(entry) {
  if (!entry?.actor || !entry?.type || !entry?.message) return null;
  try {
    return await ActivityLog.create(entry);
  } catch (e) {
    console.error("logActivity failed:", e);
    return null;
  }
}
