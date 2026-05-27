import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);

const AUTH_REQUIRED = [
  "/dashboard",
  "/projects",
  "/tasks",
  "/team",
  "/reports",
  "/profile",
  "/settings",
  "/notifications",
];
const ADMIN_ONLY = ["/team", "/reports"];

async function getUser(req) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const user = await getUser(req);

  const needsAuth = AUTH_REQUIRED.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (needsAuth && !user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const adminOnly = ADMIN_ONLY.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (adminOnly && user && user.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if ((pathname === "/login" || pathname === "/register") && user) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/tasks/:path*",
    "/team/:path*",
    "/reports/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/notifications/:path*",
    "/login",
    "/register",
  ],
};
