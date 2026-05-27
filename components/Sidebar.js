"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Users,
  BarChart3,
  Settings,
  User,
  Bell,
  LogOut,
  Sparkles,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/team", label: "Team Members", icon: Users, adminOnly: true },
  { href: "/reports", label: "Reports", icon: BarChart3, adminOnly: true },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ user, onNav }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const items = NAV.filter((i) => !i.adminOnly || user?.role === "admin");

  return (
    <aside className="h-full w-64 shrink-0 bg-ink-900 text-slate-200 flex flex-col">
      <div className="px-5 py-4 flex items-center gap-2 border-b border-slate-800">
        <span className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </span>
        <div className="leading-tight">
          <div className="font-semibold text-white">Smart PMS</div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400">
            Project & Tasks
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-auto thin-scroll py-3 px-2">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNav}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm mb-0.5 transition-colors ${
                active
                  ? "bg-brand-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-3">
        {user && (
          <div className="px-2 py-2 text-xs text-slate-400">
            <div className="text-slate-200 font-medium truncate">
              {user.name}
            </div>
            <div className="truncate">{user.email}</div>
          </div>
        )}
        <button
          onClick={logout}
          className="mt-1 w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
