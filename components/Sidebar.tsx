"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  Megaphone,
  Settings,
  Zap,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/properties", label: "Properties", icon: Building2 },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/n8n", label: "n8n Workflows", icon: Zap },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-slate-200 flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm leading-tight">Leads Egypt</p>
            <p className="text-xs text-slate-500">Real Estate CRM</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-link${active ? " active" : ""}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3 h-3 opacity-50" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-100">
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs font-semibold text-blue-800">Target Markets</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {["🇦🇪 UAE", "🇸🇦 KSA", "🇰🇼 KW", "🇶🇦 QA", "🇪🇬 Abroad"].map((c) => (
              <span
                key={c}
                className="text-xs bg-white text-blue-700 px-1.5 py-0.5 rounded border border-blue-200"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
