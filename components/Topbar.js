"use client";

import Link from "next/link";
import { Bell, Menu, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Avatar from "./Avatar";
import GlobalSearch from "./GlobalSearch";

export default function Topbar({ user, onMenu }) {
  const [unread, setUnread] = useState(0);
  const [dark, setDark] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function pull() {
      try {
        const res = await fetch("/api/notifications?unread=1&limit=1");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setUnread(data.unreadCount || 0);
      } catch {}
    }
    pull();
    const t = setInterval(pull, 30000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [pathname]);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <header className="h-16 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 gap-3">
      <button
        onClick={onMenu}
        className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        aria-label="Menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="hidden md:block flex-1 max-w-md">
        <GlobalSearch />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Toggle theme"
        >
          {dark ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>
        <Link
          href="/notifications"
          className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-semibold flex items-center justify-center">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Link>
        {user && (
          <Link
            href="/profile"
            className="flex items-center gap-2 pl-2 ml-1 border-l border-slate-200 dark:border-slate-800"
          >
            <Avatar name={user.name} size={32} />
            <div className="hidden sm:block text-sm leading-tight">
              <div className="font-medium">{user.name}</div>
              <div className="text-xs text-slate-500 capitalize">
                {user.role}
              </div>
            </div>
          </Link>
        )}
      </div>
    </header>
  );
}
