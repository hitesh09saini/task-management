import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import { getCurrentUser } from "@/lib/auth";

function isValidId(id) {
  return id && mongoose.Types.ObjectId.isValid(id);
}

export async function PUT(_req, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isValidId(params.id))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  await connectDB();
  const n = await Notification.findOneAndUpdate(
    { _id: params.id, user: user.sub },
    { $set: { read: true } },
    { new: true }
  );
  if (!n) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ notification: n });
}

export async function DELETE(_req, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isValidId(params.id))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  await connectDB();
  const res = await Notification.deleteOne({
    _id: params.id,
    user: user.sub,
  });
  if (!res.deletedCount)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
