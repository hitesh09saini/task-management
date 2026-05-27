import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { hashPassword, signToken, setAuthCookie } from "@/lib/auth";

export async function POST(req) {
  try {
    const { name, email, password } = await req.json();

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

    const normalizedEmail = email.toLowerCase().trim();
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return NextResponse.json(
        { error: "Email is already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const role =
      normalizedEmail === (process.env.ADMIN_EMAIL || "").toLowerCase()
        ? "admin"
        : "user";

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role,
    });

    const token = await signToken({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });
    await setAuthCookie(token);

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("register error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
