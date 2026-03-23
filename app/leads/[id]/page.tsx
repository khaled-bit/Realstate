"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { COUNTRIES, LEAD_STATUSES, LEAD_SOURCES, PROPERTY_TYPES } from "@/lib/constants";
import {
  ArrowLeft, Phone, Mail, MessageCircle, Edit2, Save, X,
  MapPin, Calendar, DollarSign, Activity, Building2, Trash2
} from "lucide-react";
import CommPanel from "@/components/CommPanel";

interface LeadDetail {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  country: string;
  city?: string;
  source: string;
  status: string;
  budget?: number;
  budgetCurrency: string;
  propertyType?: string;
  preferredAreas?: string;
  notes?: string;
  createdAt: string;
  lastContact?: string;
  apolloId?: string;
  externalId?: string;
  n8nWorkflowId?: string;
  activities: { id: string; type: string; content: string; by: string; createdAt: string }[];
  properties: { id: string; interest: string; property: { id: string; title: string; location: string; price: number; currency: string; type: string } }[];
}

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<LeadDetail>>({});
  const [saving, setSaving] = useState(false);
  const [activityText, setActivityText] = useState("");
  const [activityType, setActivityType] = useState("Note");

  const fetchLead = async () => {
    const res = await fetch(`/api/leads/${id}`);
    if (!res.ok) { router.push("/leads"); return; }
    const data = await res.json();
    setLead(data);
    setEditData(data);
    setLoading(false);
  };

  useEffect(() => { fetchLead(); }, [id]);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editData),
    });
    if (res.ok) {
      const updated = await res.json();
      setLead((prev) => prev ? { ...prev, ...updated } : prev);
      setEditing(false);
    }
    setSaving(false);
  };

  const handleStatusChange = async (status: string) => {
    const res = await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      await fetchLead();
    }
  };

  const handleAddActivity = async () => {
    if (!activityText.trim()) return;
    await fetch(`/api/leads/${id}/activity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: activityType, content: activityText }),
    });
    setActivityText("");
    await fetchLead();
  };

  const handleDelete = async () => {
    if (!confirm("Delete this lead? This action cannot be undone.")) return;
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
    router.push("/leads");
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-48" />
          <div className="h-48 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!lead) return null;

  const country = COUNTRIES.find((c) => c.value === lead.country);
  const status = LEAD_STATUSES.find((s) => s.value === lead.status);

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/leads" className="text-slate-500 hover:text-slate-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl font-bold text-blue-700">
            {lead.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{lead.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`badge ${status?.color || "bg-slate-100 text-slate-600"}`}>
                {status?.label || lead.status}
              </span>
              <span className="text-xs text-slate-500">
                {country?.flag} {country?.label?.split(" - ")[0] || lead.country}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-1">
                <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
              </button>
              <button onClick={() => setEditing(false)} className="btn-secondary flex items-center gap-1">
                <X className="w-4 h-4" /> Cancel
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="btn-secondary flex items-center gap-1">
                <Edit2 className="w-4 h-4" /> Edit
              </button>
              <button onClick={handleDelete} className="btn-secondary text-red-600 hover:bg-red-50 flex items-center gap-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status Pipeline */}
      <div className="card p-4 mb-4">
        <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Pipeline Stage</p>
        <div className="flex gap-1 flex-wrap">
          {LEAD_STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => handleStatusChange(s.value)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                lead.status === s.value
                  ? `${s.color} border-transparent font-semibold`
                  : "border-slate-200 text-slate-500 hover:border-slate-400"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Info Card */}
        <div className="card p-4 lg:col-span-2 space-y-4 order-2 lg:order-1">
          <h2 className="font-semibold text-slate-900">Lead Details</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</label>
              {editing ? (
                <input className="input mt-1" value={editData.email || ""} onChange={(e) => setEditData((p) => ({ ...p, email: e.target.value }))} />
              ) : (
                <a href={`mailto:${lead.email}`} className="text-sm text-blue-600 hover:underline mt-1 block">{lead.email || "—"}</a>
              )}
            </div>
            <div>
              <label className="text-xs text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</label>
              {editing ? (
                <input className="input mt-1" value={editData.phone || ""} onChange={(e) => setEditData((p) => ({ ...p, phone: e.target.value }))} />
              ) : (
                <a href={`tel:${lead.phone}`} className="text-sm text-blue-600 hover:underline mt-1 block">{lead.phone || "—"}</a>
              )}
            </div>
            <div>
              <label className="text-xs text-slate-500 flex items-center gap-1"><MessageCircle className="w-3 h-3" /> WhatsApp</label>
              {editing ? (
                <input className="input mt-1" value={editData.whatsapp || ""} onChange={(e) => setEditData((p) => ({ ...p, whatsapp: e.target.value }))} />
              ) : lead.whatsapp ? (
                <a href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-sm text-green-600 hover:underline mt-1 block">
                  {lead.whatsapp}
                </a>
              ) : <p className="text-sm mt-1">—</p>}
            </div>
            <div>
              <label className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> Location</label>
              {editing ? (
                <div className="flex gap-1 mt-1">
                  <select className="input flex-1" value={editData.country || ""} onChange={(e) => setEditData((p) => ({ ...p, country: e.target.value }))}>
                    {COUNTRIES.map((c) => <option key={c.value} value={c.value}>{c.flag} {c.label}</option>)}
                  </select>
                </div>
              ) : (
                <p className="text-sm mt-1">{country?.flag} {lead.city ? `${lead.city}, ` : ""}{country?.label?.split(" - ")[0] || lead.country}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-slate-500 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Budget</label>
              {editing ? (
                <div className="flex gap-1 mt-1">
                  <input type="number" className="input flex-1" value={editData.budget || ""} onChange={(e) => setEditData((p) => ({ ...p, budget: parseFloat(e.target.value) }))} placeholder="Amount" />
                  <select className="input w-24" value={editData.budgetCurrency || "USD"} onChange={(e) => setEditData((p) => ({ ...p, budgetCurrency: e.target.value }))}>
                    {["USD","AED","SAR","EGP","GBP","EUR"].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              ) : (
                <p className="text-sm mt-1">{lead.budget ? `${lead.budgetCurrency} ${Number(lead.budget).toLocaleString()}` : "—"}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-slate-500 flex items-center gap-1"><Building2 className="w-3 h-3" /> Property Type</label>
              {editing ? (
                <select className="input mt-1" value={editData.propertyType || ""} onChange={(e) => setEditData((p) => ({ ...p, propertyType: e.target.value }))}>
                  <option value="">Any</option>
                  {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              ) : (
                <p className="text-sm mt-1">{lead.propertyType || "—"}</p>
              )}
            </div>
          </div>

          {lead.preferredAreas && (
            <div>
              <label className="text-xs text-slate-500">Preferred Areas</label>
              <div className="flex flex-wrap gap-1 mt-1">
                {lead.preferredAreas.split(",").map((a) => (
                  <span key={a} className="badge bg-blue-50 text-blue-700">{a.trim()}</span>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-slate-500">Notes</label>
            {editing ? (
              <textarea
                className="input mt-1 resize-none"
                rows={3}
                value={editData.notes || ""}
                onChange={(e) => setEditData((p) => ({ ...p, notes: e.target.value }))}
              />
            ) : (
              <p className="text-sm text-slate-700 mt-1 bg-slate-50 rounded-lg p-3">{lead.notes || "No notes"}</p>
            )}
          </div>

          {(lead.source || lead.apolloId) && (
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="text-xs text-slate-500">Source</label>
                <p className="text-sm mt-1">{LEAD_SOURCES.find((s) => s.value === lead.source)?.label || lead.source}</p>
              </div>
              {lead.apolloId && (
                <div>
                  <label className="text-xs text-slate-500">Apollo ID</label>
                  <p className="text-sm font-mono mt-1 text-slate-600">{lead.apolloId}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Communication Panel + Activity Feed */}
        <div className="flex flex-col gap-4 order-1 lg:order-2">
        {/* Comm Panel */}
        <CommPanel
          leadId={lead.id}
          leadName={lead.name}
          phone={lead.phone}
          whatsapp={lead.whatsapp}
        />

        {/* Activity Feed */}
        <div className="card p-4">
          <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Activity
          </h2>

          {/* Add Activity */}
          <div className="mb-4 space-y-2">
            <select
              className="input text-xs"
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
            >
              {["Note", "Call", "Email", "WhatsApp", "Meeting"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <textarea
              className="input resize-none text-sm"
              rows={2}
              placeholder="Log a call, note, email..."
              value={activityText}
              onChange={(e) => setActivityText(e.target.value)}
            />
            <button onClick={handleAddActivity} className="btn-primary w-full text-xs">
              Add Activity
            </button>
          </div>

          {/* Feed */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {lead.activities.map((act) => (
              <div key={act.id} className="border-l-2 border-blue-200 pl-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-0.5">
                  <span className="font-medium text-slate-700">{act.type}</span>
                  <span>·</span>
                  <span>{act.by}</span>
                  <span>·</span>
                  <span className="flex items-center gap-0.5">
                    <Calendar className="w-3 h-3" />
                    {new Date(act.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{act.content}</p>
              </div>
            ))}
            {lead.activities.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">No activities yet</p>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
