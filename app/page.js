import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import {
  ListTodo,
  FolderKanban,
  BarChart3,
  Bell,
  Users,
  Shield,
  ArrowRight,
} from "lucide-react";

export default async function HomePage() {
  const user = await getCurrentUser();
  const ctaHref = user ? "/dashboard" : "/register";

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold">
              S
            </span>
            <span className="font-semibold">Smart PMS</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            {!user && (
              <Link href="/login" className="hover:text-brand-600">
                Login
              </Link>
            )}
            <Link
              href={ctaHref}
              className="px-3 py-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700"
            >
              {user ? "Open dashboard" : "Get started"}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold tracking-tight">
            Smart Project &{" "}
            <span className="text-brand-600">Task Management</span>
          </h1>
          <p className="mt-5 text-lg text-slate-600">
            Centralize projects, assign tasks, track progress and collaborate —
            all in one place. Built for modern teams who ship.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 font-medium"
            >
              {user ? "Go to dashboard" : "Get started free"}
              <ArrowRight className="w-4 h-4" />
            </Link>
            {!user && (
              <Link
                href="/login"
                className="px-5 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 font-medium"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Feature
            icon={FolderKanban}
            title="Projects & teams"
            body="Admins create projects, assign team members and track status from planning to completion."
          />
          <Feature
            icon={ListTodo}
            title="Tasks with everything"
            body="Priorities, due dates, status, comments and file attachments — all in one place."
          />
          <Feature
            icon={Bell}
            title="Live notifications"
            body="In-app notifications when you're assigned a task, a comment lands or a deadline approaches."
          />
          <Feature
            icon={BarChart3}
            title="Reports & analytics"
            body="Workload, throughput and overdue counts so admins see what's moving and what's stuck."
          />
          <Feature
            icon={Users}
            title="Role-based access"
            body="Admins manage everything; team members focus on what's assigned to them."
          />
          <Feature
            icon={Shield}
            title="Secure by default"
            body="Bcrypt password hashing, JWT in httpOnly cookies, route-level guards."
          />
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-slate-500 text-center">
          © {new Date().getFullYear()} Smart PMS · Built with Next.js & MongoDB
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon: Icon, title, body }) {
  return (
    <div className="p-6 rounded-xl bg-white border border-slate-200/70 shadow-card">
      <span className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
        <Icon className="w-5 h-5" />
      </span>
      <h3 className="font-semibold mt-4">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{body}</p>
    </div>
  );
}
