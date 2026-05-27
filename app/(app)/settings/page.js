"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Bell, Palette } from "lucide-react";
import PageHeader from "@/components/PageHeader";

export default function SettingsPage() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme(next) {
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Personalize your experience."
      />

      <div className="space-y-4 max-w-2xl">
        <Card title="Appearance" icon={Palette}>
          <p className="text-sm text-slate-500 mb-4">
            Switch between light and dark mode.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <ThemeOption
              active={!dark}
              onClick={() => toggleTheme(false)}
              icon={Sun}
              label="Light"
            />
            <ThemeOption
              active={dark}
              onClick={() => toggleTheme(true)}
              icon={Moon}
              label="Dark"
            />
          </div>
        </Card>

        <Card title="Notifications" icon={Bell}>
          <p className="text-sm text-slate-500">
            You'll receive in-app notifications when:
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <Item label="A task is assigned to you" />
            <Item label="Someone comments on your task" />
            <Item label="A task status changes" />
            <Item label="You're added to a project" />
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, icon: Icon, children }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-xl shadow-card p-5">
      <h3 className="font-semibold flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-brand-600" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function ThemeOption({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 p-4 rounded-lg border transition-colors ${
        active
          ? "border-brand-500 bg-brand-50 dark:bg-brand-600/10 text-brand-700 dark:text-brand-400"
          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </button>
  );
}

function Item({ label }) {
  return (
    <li className="flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      {label}
    </li>
  );
}
