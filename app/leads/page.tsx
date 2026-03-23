"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { COUNTRIES, LEAD_STATUSES, LEAD_SOURCES } from "@/lib/constants";
import { Users, Plus, Search, Filter, Phone, Mail, MessageCircle, Trash2, ChevronLeft, ChevronRight, CheckSquare, Square } from "lucide-react";

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
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState("");
  const [bulkWorking, setBulkWorking] = useState(false);
  const limit = 50;

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterStatus) params.set("status", filterStatus);
    if (filterCountry) params.set("country", filterCountry);
    if (filterSource) params.set("source", filterSource);
    params.set("page", String(page));
    params.set("limit", String(limit));
    const res = await fetch(`/api/leads?${params}`);
    const data = await res.json();
    setLeads(data.leads || []);
    setTotal(data.total || 0);
    setSelected(new Set());
    setLoading(false);
  }, [search, filterStatus, filterCountry, filterSource, page]);

  useEffect(() => {
    const t = setTimeout(fetchLeads, 300);
    return () => clearTimeout(t);
  }, [fetchLeads]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [search, filterStatus, filterCountry, filterSource]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === leads.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(leads.map((l) => l.id)));
    }
  };

  const applyBulkAction = async () => {
    if (!bulkAction || selected.size === 0) return;
    setBulkWorking(true);
    const ids = Array.from(selected);

    if (bulkAction === "delete") {
      if (!confirm(`Delete ${ids.length} lead(s)? This cannot be undone.`)) {
        setBulkWorking(false);
        return;
      }
      await Promise.all(ids.map((id) => fetch(`/api/leads/${id}`, { method: "DELETE" })));
    } else {
      // status change
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/leads/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: bulkAction }),
          })
        )
      );
    }

    setBulkWorking(false);
    setBulkAction("");
    setSelected(new Set());
    fetchLeads();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-4 md:p-6">
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

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="card p-3 mb-3 flex items-center gap-3 bg-blue-50 border border-blue-200">
          <span className="text-sm font-medium text-blue-900">{selected.size} selected</span>
          <select
            className="input text-sm flex-1 max-w-xs"
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
          >
            <option value="">Bulk action...</option>
            <optgroup label="Change Status">
              {LEAD_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>→ {s.label}</option>
              ))}
            </optgroup>
            <optgroup label="Actions">
              <option value="delete">🗑 Delete selected</option>
            </optgroup>
          </select>
          <button
            onClick={applyBulkAction}
            disabled={!bulkAction || bulkWorking}
            className="btn-primary text-sm px-4 disabled:opacity-50"
          >
            {bulkWorking ? "Working..." : "Apply"}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-3 py-3 w-10">
                <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-700">
                  {selected.size === leads.length && leads.length > 0
                    ? <CheckSquare className="w-4 h-4 text-blue-600" />
                    : <Square className="w-4 h-4" />}
                </button>
              </th>
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
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-slate-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                  <Filter className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No leads found. Try adjusting filters or{" "}
                  <Link href="/leads/new" className="text-blue-600 hover:underline">add one manually</Link>.
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const country = COUNTRIES.find((c) => c.value === lead.country);
                const status = LEAD_STATUSES.find((s) => s.value === lead.status);
                const isSelected = selected.has(lead.id);
                return (
                  <tr key={lead.id} className={`table-row-hover ${isSelected ? "bg-blue-50" : ""}`}>
                    <td className="px-3 py-3">
                      <button onClick={() => toggleSelect(lead.id)} className="text-slate-400 hover:text-slate-700">
                        {isSelected
                          ? <CheckSquare className="w-4 h-4 text-blue-600" />
                          : <Square className="w-4 h-4" />}
                      </button>
                    </td>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages} · {total} leads
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary px-3 py-2 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-9 h-9 text-sm rounded-lg ${
                    pageNum === page
                      ? "bg-blue-600 text-white font-semibold"
                      : "btn-secondary"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary px-3 py-2 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
