import { CheckCircle2, ListTodo, BarChart3, Bell } from "lucide-react";

export default function AuthBrandPanel() {
  return (
    <aside className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-brand-600 via-brand-700 to-ink-900 text-white relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-brand-500/30 blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-12">
          <span className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
            <ListTodo className="w-5 h-5" />
          </span>
          <span className="font-semibold text-lg">Smart PMS</span>
        </div>
        <h2 className="text-4xl font-bold leading-tight">
          Everything your team
          <br />
          needs to ship work.
        </h2>
        <p className="mt-4 text-white/80 max-w-md">
          Plan projects, assign tasks, track progress and collaborate — all in
          one place. Built for modern teams.
        </p>
        <ul className="mt-10 space-y-3 text-sm">
          <Feature icon={CheckCircle2}>Centralized project & task tracking</Feature>
          <Feature icon={BarChart3}>Live reports and team analytics</Feature>
          <Feature icon={Bell}>Real-time notifications</Feature>
        </ul>
      </div>
      <div className="relative text-xs text-white/60">
        © {new Date().getFullYear()} Smart PMS · Built with Next.js & MongoDB
      </div>
    </aside>
  );
}

function Feature({ icon: Icon, children }) {
  return (
    <li className="flex items-center gap-3">
      <span className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" />
      </span>
      <span>{children}</span>
    </li>
  );
}
