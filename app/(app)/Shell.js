"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default function Shell({ user, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="h-screen flex bg-ink-50 dark:bg-slate-950 text-ink-900 dark:text-slate-100 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar user={user} />
      </div>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-50">
            <Sidebar user={user} onNav={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar user={user} onMenu={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-auto thin-scroll p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
