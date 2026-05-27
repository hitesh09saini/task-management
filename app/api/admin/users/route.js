import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { requireAdmin } from "@/lib/rbac";
import { hashPassword } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  await connectDB();
  const users = await User.find({})
    .select("-passwordHash")
    .sort({ createdAt: -1 });
  return NextResponse.json({ users });
}

export async function POST(req) {
  const { user, error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const name = (body?.name || "").trim();
  const email = (body?.email || "").toLowerCase().trim();
  const password = body?.password || "";
  const role = body?.role === "admin" ? "admin" : "user";

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Name, email and password are required" },
      { status: 400 }
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  await connectDB();
  const existing = await User.findOne({ email });
  if (existing) {
    return NextResponse.json(
      { error: "A user with this email already exists" },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);
  const created = await User.create({
    name,
    email,
    passwordHash,
    role,
    active: true,
  });

  await logActivity({
    actor: user.sub,
    actorName: user.name,
    type: "user_created",
    targetType: "user",
    targetId: created._id,
    targetName: created.name,
    message: `created user "${created.name}" (${created.email})`,
  });

  return NextResponse.json(
    {
      user: {
        _id: created._id,
        name: created.name,
        email: created.email,
        role: created.role,
        active: created.active,
        createdAt: created.createdAt,
      },
    },
    { status: 201 }
  );
}
