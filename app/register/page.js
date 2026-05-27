"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, Loader2 } from "lucide-react";
import AuthBrandPanel from "@/components/AuthBrandPanel";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setErr(data.error || "Failed to register");
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
          <h1 className="text-3xl font-bold tracking-tight">
            Create your account
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Already have one?{" "}
            <Link
              href="/login"
              className="text-brand-600 font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <Field
              label="Full name"
              icon={User}
              type="text"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              placeholder="Jane Doe"
            />
            <Field
              label="Email"
              icon={Mail}
              type="email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
              placeholder="you@company.com"
            />
            <Field
              label="Password (min 6 characters)"
              icon={Lock}
              type="password"
              value={form.password}
              onChange={(v) => setForm({ ...form, password: v })}
              placeholder="••••••••"
              minLength={6}
            />
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
              {busy ? "Creating account..." : "Create account"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

function Field({ label, icon: Icon, type, value, onChange, placeholder, minLength }) {
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
          minLength={minLength}
          className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
      </div>
    </label>
  );
}
