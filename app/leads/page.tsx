"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { COUNTRIES, LEAD_STATUSES, LEAD_SOURCES } from "@/lib/constants";
import { Users, Plus, Search, Filter, Phone, Mail, MessageCircle } from "lucide-react";

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  country: string;
  source: string;
  status: string;
  budget?: number;
  budgetCurrency: string;
  createdAt: string;
  _count: { activities: number };
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterSource, setFilterSource] = useState("");

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterStatus) params.set("status", filterStatus);
    if (filterCountry) params.set("country", filterCountry);
    if (filterSource) params.set("source", filterSource);
    const res = await fetch(`/api/leads?${params}`);
    const data = await res.json();
    setLeads(data.leads || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [search, filterStatus, filterCountry, filterSource]);

  useEffect(() => {
    const t = setTimeout(fetchLeads, 300);
    return () => clearTimeout(t);
  }, [fetchLeads]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Leads
          </h1>
          <p className="text-sm text-slate-500">{total} total leads</p>
        </div>
        <Link href="/leads/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Lead
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select
            className="input"
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
          >
            <option value="">All Countries</option>
            {COUNTRIES.map((c) => (
              <option key={c.value} value={c.value}>{c.flag} {c.label.split(" - ")[0]}</option>
            ))}
          </select>
          <select
            className="input"
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
          >
            <option value="">All Sources</option>
            {LEAD_SOURCES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Country</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Contact</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Source</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Budget</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden xl:table-cell">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-slate-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                  <Filter className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No leads found. Try adjusting filters or{" "}
                  <Link href="/leads/new" className="text-blue-600 hover:underline">add one manually</Link>.
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const country = COUNTRIES.find((c) => c.value === lead.country);
                const status = LEAD_STATUSES.find((s) => s.value === lead.status);
                return (
                  <tr key={lead.id} className="table-row-hover">
                    <td className="px-4 py-3">
                      <Link href={`/leads/${lead.id}`} className="block">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-700 shrink-0">
                            {lead.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{lead.name}</p>
                            {lead._count.activities > 0 && (
                              <p className="text-xs text-slate-400">{lead._count.activities} activities</p>
                            )}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <span>{country?.flag || "🌍"}</span>
                        <span className="hidden sm:inline">{country?.label?.split(" - ")[0] || lead.country}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        {lead.phone && (
                          <a href={`tel:${lead.phone}`} className="text-slate-400 hover:text-blue-600">
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {lead.email && (
                          <a href={`mailto:${lead.email}`} className="text-slate-400 hover:text-blue-600">
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {lead.whatsapp && (
                          <a
                            href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-green-600"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <span className="text-xs text-slate-500 truncate max-w-[120px]">
                          {lead.email || lead.phone || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-slate-600 text-xs">
                      {lead.source}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-slate-700 text-xs">
                      {lead.budget
                        ? `${lead.budgetCurrency} ${Number(lead.budget).toLocaleString()}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${status?.color || "bg-slate-100 text-slate-600"}`}>
                        {status?.label || lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell text-xs text-slate-400">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
