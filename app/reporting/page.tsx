"use client";

import { useEffect, useState, useCallback } from "react";
import { TrendingUp, Users, DollarSign, Target } from "lucide-react";

type ReportingData = {
  totalLeads: number;
  conversionRate: string;
  totalPipelineValue: number;
  byStatus: Array<{ status: string; _count: { status: number } }>;
  bySource: Array<{ source: string; _count: { source: number } }>;
  byMonth: Array<{ month: string; count: number }>;
  topAgents: Array<{ id: string; name: string; leadsCount: number }>;
  sourceConversion: Array<{ source: string; total: number; won: number; rate: string }>;
  budgetByStatus: Array<{ status: string; _sum: { budget: number | null }; _count: { status: number } }>;
};

const RANGES = ["7d", "30d", "90d", "all"] as const;
type Range = typeof RANGES[number];

const RANGE_LABELS: Record<Range, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "all": "All time",
};

const STATUS_COLORS: Record<string, string> = {
  New: "#3b82f6",
  Contacted: "#f59e0b",
  Qualified: "#8b5cf6",
  Proposal: "#f97316",
  Won: "#10b981",
  Lost: "#ef4444",
  Deal: "#10b981",
};

export default function ReportingPage() {
  const [data, setData] = useState<ReportingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>("30d");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reporting?range=${range}`);
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalFromStatus = data?.byStatus.reduce((a, s) => a + s._count.status, 0) || 1;
  const maxMonth = Math.max(...(data?.byMonth.map((m) => m.count) || [1]));
  const maxSource = Math.max(...(data?.bySource.map((s) => s._count.source) || [1]));
  const maxAgent = Math.max(...(data?.topAgents.map((a) => a.leadsCount) || [1]));

  const formatCurrency = (val: number) => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
    return `$${val.toFixed(0)}`;
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="h-8 bg-slate-200 rounded w-40 mb-8 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => <div key={i} className="card animate-pulse h-24" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="card animate-pulse h-64" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-500 text-sm mt-1">Analytics and pipeline insights</p>
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                range === r ? "bg-white text-slate-900 shadow-sm font-medium" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Leads</p>
              <p className="text-2xl font-bold text-slate-900">{data?.totalLeads.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Conversion Rate</p>
              <p className="text-2xl font-bold text-slate-900">{data?.conversionRate}%</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Pipeline Value</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(data?.totalPipelineValue || 0)}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Won Leads</p>
              <p className="text-2xl font-bold text-slate-900">
                {data?.byStatus.find((s) => s.status === "Won" || s.status === "Deal")?._count.status || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads by Month - Bar Chart */}
        <div className="card">
          <h2 className="font-semibold text-slate-900 mb-4">Leads by Month</h2>
          {!data?.byMonth.length ? (
            <p className="text-slate-400 text-sm text-center py-8">No data</p>
          ) : (
            <div className="flex items-end gap-1 h-48">
              {data.byMonth.map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-slate-500">{m.count}</span>
                  <div
                    className="w-full bg-blue-500 rounded-t-sm transition-all"
                    style={{ height: `${Math.max(4, (m.count / maxMonth) * 160)}px` }}
                    title={`${m.month}: ${m.count}`}
                  />
                  <span className="text-xs text-slate-400 truncate w-full text-center">
                    {m.month.split("-")[1]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pipeline Funnel */}
        <div className="card">
          <h2 className="font-semibold text-slate-900 mb-4">Pipeline Funnel</h2>
          {!data?.byStatus.length ? (
            <p className="text-slate-400 text-sm text-center py-8">No data</p>
          ) : (
            <div className="space-y-2">
              {["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"].map((status) => {
                const count = data.byStatus.find((s) => s.status === status)?._count.status || 0;
                const pct = Math.round((count / totalFromStatus) * 100);
                return (
                  <div key={status} className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 w-20 shrink-0">{status}</span>
                    <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: STATUS_COLORS[status] || "#94a3b8",
                          minWidth: count > 0 ? "2%" : "0",
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-700 w-14 text-right shrink-0">
                      {count} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Conversion by Source */}
        <div className="card">
          <h2 className="font-semibold text-slate-900 mb-4">Leads by Source</h2>
          {!data?.bySource.length ? (
            <p className="text-slate-400 text-sm text-center py-8">No data</p>
          ) : (
            <div className="space-y-2">
              {data.bySource.map((s) => {
                const pct = Math.round((s._count.source / maxSource) * 100);
                const convData = data.sourceConversion.find((sc) => sc.source === s.source);
                return (
                  <div key={s.source}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs text-slate-700">{s.source}</span>
                      <span className="text-xs text-slate-500">
                        {s._count.source} leads
                        {convData && convData.won > 0 && (
                          <span className="text-green-600 ml-2">· {convData.rate}% conv.</span>
                        )}
                      </span>
                    </div>
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-400 rounded-full transition-all"
                        style={{ width: `${pct}%`, minWidth: "2%" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Agents */}
        <div className="card">
          <h2 className="font-semibold text-slate-900 mb-4">Top Agents by Leads</h2>
          {!data?.topAgents.length ? (
            <p className="text-slate-400 text-sm text-center py-8">No agents</p>
          ) : (
            <div className="space-y-3">
              {data.topAgents.slice(0, 8).map((agent, idx) => {
                const pct = maxAgent > 0 ? Math.round((agent.leadsCount / maxAgent) * 100) : 0;
                const initials = agent.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <div key={agent.id} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-4 shrink-0">#{idx + 1}</span>
                    <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-bold">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-800 truncate">{agent.name}</span>
                        <span className="text-xs font-medium text-slate-700 ml-2 shrink-0">{agent.leadsCount}</span>
                      </div>
                      <div className="mt-0.5 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-400 rounded-full"
                          style={{ width: `${pct}%`, minWidth: "4%" }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
