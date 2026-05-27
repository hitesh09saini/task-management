import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { verifyPassword, signToken, setAuthCookie } from "@/lib/auth";

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (user.active === false) {
      return NextResponse.json(
        { error: "Your account has been deactivated. Please contact an administrator." },
        { status: 403 }
      );
    }

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
    console.error("login error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
