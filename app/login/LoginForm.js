"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, Loader2 } from "lucide-react";
import AuthBrandPanel from "@/components/AuthBrandPanel";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const expired = params.get("expired") === "1";
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState(
    expired ? "Your session expired. Please sign in again." : ""
  );
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setErr(data.error || "Failed to login");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-ink-50">
      <AuthBrandPanel />
      <section className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden flex items-center gap-2">
            <span className="w-9 h-9 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold">
              S
            </span>
            <span className="font-semibold text-lg">Smart PMS</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-sm text-slate-500 mt-2">
            Need an account?{" "}
            <Link
              href="/register"
              className="text-brand-600 font-medium hover:underline"
            >
              Create one
            </Link>
          </p>
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <Field
              label="Email"
              icon={Mail}
              type="email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
              placeholder="you@company.com"
            />
            <Field
              label="Password"
              icon={Lock}
              type="password"
              value={form.password}
              onChange={(v) => setForm({ ...form, password: v })}
              placeholder="••••••••"
            />
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-600">
                <input type="checkbox" className="accent-brand-600" />
                Remember me
              </label>
              <a className="text-brand-600 hover:underline" href="#">
                Forgot password?
              </a>
            </div>
            {err && (
              <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                {err}
              </p>
            )}
            <button
              disabled={busy}
              className="w-full px-4 py-2.5 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {busy ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

function Field({ label, icon: Icon, type, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </span>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          required
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
      </div>
    </label>
  );
}
