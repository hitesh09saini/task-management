import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unread") === "1";
  const limit = Math.min(parseInt(searchParams.get("limit") || "30", 10), 100);

  const query = { user: user.sub };
  if (unreadOnly) query.read = false;

  const [items, unreadCount] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).limit(limit).lean(),
    Notification.countDocuments({ user: user.sub, read: false }),
  ]);

  return NextResponse.json({ notifications: items, unreadCount });
}

export async function PUT() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  await Notification.updateMany(
    { user: user.sub, read: false },
    { $set: { read: true } }
  );
  return NextResponse.json({ ok: true });
}
