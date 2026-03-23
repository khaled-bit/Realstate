export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { COUNTRIES, LEAD_STATUSES } from "@/lib/constants";
import Link from "next/link";
import {
  Users,
  TrendingUp,
  Building2,
  Zap,
  Star,
  ArrowUpRight,
  Calendar,
} from "lucide-react";

async function getStats() {
  const [
    totalLeads,
    byStatus,
    byCountry,
    bySource,
    weekLeads,
    monthLeads,
    totalProperties,
    recentLeads,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.lead.groupBy({
      by: ["country"],
      _count: { country: true },
      orderBy: { _count: { country: "desc" } },
      take: 6,
    }),
    prisma.lead.groupBy({
      by: ["source"],
      _count: { source: true },
      orderBy: { _count: { source: "desc" } },
    }),
    prisma.lead.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
    }),
    prisma.lead.count({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 86400000) } },
    }),
    prisma.property.count(),
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        country: true,
        status: true,
        source: true,
        createdAt: true,
        budget: true,
        budgetCurrency: true,
      },
    }),
  ]);

  const deals = byStatus.find((s) => s.status === "Deal")?._count.status ?? 0;
  const qualified = byStatus.find((s) => s.status === "Qualified")?._count.status ?? 0;
  const conversionRate = totalLeads > 0 ? ((deals / totalLeads) * 100).toFixed(1) : "0";

  return {
    totalLeads,
    deals,
    qualified,
    weekLeads,
    monthLeads,
    conversionRate,
    byStatus,
    byCountry,
    bySource,
    totalProperties,
    recentLeads,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const statCards = [
    {
      label: "Total Leads",
      value: stats.totalLeads,
      sub: `+${stats.weekLeads} this week`,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "This Month",
      value: stats.monthLeads,
      sub: "New leads (30 days)",
      icon: Calendar,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "Qualified",
      value: stats.qualified,
      sub: "Ready for proposal",
      icon: Star,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Deals Closed",
      value: stats.deals,
      sub: `${stats.conversionRate}% conversion`,
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-50",
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Real estate leads — Egyptian market for Gulf &amp; expat clients
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => (
          <div key={card.label} className="card p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">{card.label}</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{card.value}</p>
                <p className="text-xs text-slate-500 mt-1">{card.sub}</p>
              </div>
              <div className={`${card.bg} p-2 rounded-lg`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Pipeline */}
        <div className="card p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Lead Pipeline</h2>
            <Link href="/leads" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {LEAD_STATUSES.map((s) => {
              const count = stats.byStatus.find((b) => b.status === s.value)?._count.status ?? 0;
              const pct = stats.totalLeads > 0 ? (count / stats.totalLeads) * 100 : 0;
              return (
                <div key={s.value}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className={`badge ${s.color}`}>{s.label}</span>
                    <span className="font-semibold text-slate-700">{count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* By Country */}
        <div className="card p-4">
          <h2 className="font-semibold text-slate-900 mb-4">By Country 🌍</h2>
          <div className="space-y-3">
            {stats.byCountry.map((c) => {
              const country = COUNTRIES.find((x) => x.value === c.country);
              return (
                <div key={c.country} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span>{country?.flag || "🌍"}</span>
                    <span className="text-slate-700">
                      {country?.label?.split(" - ")[0] || c.country}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full text-xs">
                    {c._count.country}
                  </span>
                </div>
              );
            })}
            {stats.byCountry.length === 0 && (
              <p className="text-slate-400 text-xs text-center py-4">No leads yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Leads */}
        <div className="card lg:col-span-2">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Recent Leads</h2>
            <Link href="/leads" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              All leads <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {stats.recentLeads.map((lead) => {
              const country = COUNTRIES.find((x) => x.value === lead.country);
              const status = LEAD_STATUSES.find((x) => x.value === lead.status);
              return (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-700">
                      {lead.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{lead.name}</p>
                      <p className="text-xs text-slate-500">
                        {country?.flag} {country?.label?.split(" - ")[0] || lead.country} · {lead.source}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {lead.budget && (
                      <span className="text-xs text-slate-500">
                        {lead.budgetCurrency} {Number(lead.budget).toLocaleString()}
                      </span>
                    )}
                    <span className={`badge ${status?.color || "bg-slate-100 text-slate-600"}`}>
                      {status?.label || lead.status}
                    </span>
                  </div>
                </Link>
              );
            })}
            {stats.recentLeads.length === 0 && (
              <div className="px-4 py-8 text-center text-slate-400 text-sm">
                No leads yet — add one manually or connect n8n.
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-4">
          <h2 className="font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link
              href="/leads/new"
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" />
              Add Lead Manually
            </Link>
            <Link
              href="/campaigns/new"
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Launch n8n Campaign
            </Link>
            <Link
              href="/properties/new"
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              <Building2 className="w-4 h-4" />
              Add Property
            </Link>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500 uppercase mb-3">Lead Sources</h3>
            <div className="space-y-2">
              {stats.bySource.slice(0, 5).map((s) => (
                <div key={s.source} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{s.source}</span>
                  <span className="font-semibold text-slate-900">{s._count.source}</span>
                </div>
              ))}
              {stats.bySource.length === 0 && (
                <p className="text-slate-400 text-xs">No data yet</p>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Building2 className="w-4 h-4 text-slate-400" />
                Properties Listed
              </div>
              <Link href="/properties" className="font-bold text-blue-600">
                {stats.totalProperties}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
