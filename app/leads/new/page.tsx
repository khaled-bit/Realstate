"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { COUNTRIES, LEAD_SOURCES, LEAD_STATUSES, PROPERTY_TYPES, CAIRO_AREAS } from "@/lib/constants";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export default function NewLeadPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    whatsapp: "",
    country: "UAE",
    city: "",
    source: "Manual",
    status: "New",
    budget: "",
    budgetCurrency: "USD",
    propertyType: "",
    preferredAreas: [] as string[],
    notes: "",
    apolloId: "",
    externalId: "",
  });

  const set = (field: string, value: string | string[]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        preferredAreas: form.preferredAreas.join(","),
      }),
    });
    if (res.ok) {
      const lead = await res.json();
      router.push(`/leads/${lead.id}`);
    } else {
      setSaving(false);
      alert("Failed to save lead");
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/leads" className="text-slate-500 hover:text-slate-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New Lead</h1>
          <p className="text-sm text-slate-500">Add a lead manually</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Personal Info */}
        <div className="card p-4">
          <h2 className="font-semibold text-slate-900 mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Full Name *</label>
              <input
                required
                className="input"
                placeholder="Mohamed Ahmed"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                className="input"
                placeholder="client@email.com"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
              <input
                className="input"
                placeholder="+971 50 123 4567"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">WhatsApp</label>
              <input
                className="input"
                placeholder="+971 50 123 4567"
                value={form.whatsapp}
                onChange={(e) => set("whatsapp", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Location & Source */}
        <div className="card p-4">
          <h2 className="font-semibold text-slate-900 mb-4">Location & Source</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Country *</label>
              <select
                required
                className="input"
                value={form.country}
                onChange={(e) => set("country", e.target.value)}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.flag} {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">City</label>
              <input
                className="input"
                placeholder="Dubai, Riyadh..."
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Lead Source *</label>
              <select
                required
                className="input"
                value={form.source}
                onChange={(e) => set("source", e.target.value)}
              >
                {LEAD_SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
              >
                {LEAD_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Property Interest */}
        <div className="card p-4">
          <h2 className="font-semibold text-slate-900 mb-4">Property Interest</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Budget</label>
              <input
                type="number"
                className="input"
                placeholder="150000"
                value={form.budget}
                onChange={(e) => set("budget", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Currency</label>
              <select
                className="input"
                value={form.budgetCurrency}
                onChange={(e) => set("budgetCurrency", e.target.value)}
              >
                <option value="USD">USD</option>
                <option value="AED">AED</option>
                <option value="SAR">SAR</option>
                <option value="EGP">EGP</option>
                <option value="GBP">GBP</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Property Type</label>
              <select
                className="input"
                value={form.propertyType}
                onChange={(e) => set("propertyType", e.target.value)}
              >
                <option value="">Any Type</option>
                {PROPERTY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-medium text-slate-700 mb-2">Preferred Areas in Egypt</label>
            <div className="flex flex-wrap gap-2">
              {CAIRO_AREAS.map((area) => (
                <button
                  type="button"
                  key={area}
                  onClick={() =>
                    set(
                      "preferredAreas",
                      form.preferredAreas.includes(area)
                        ? form.preferredAreas.filter((a) => a !== area)
                        : [...form.preferredAreas, area]
                    )
                  }
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    form.preferredAreas.includes(area)
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-slate-300 text-slate-600 hover:border-blue-400"
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notes & IDs */}
        <div className="card p-4">
          <h2 className="font-semibold text-slate-900 mb-4">Notes & External IDs</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
              <textarea
                className="input resize-none"
                rows={3}
                placeholder="Client preferences, notes from conversation..."
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Apollo ID</label>
                <input
                  className="input font-mono text-xs"
                  placeholder="apollo_..."
                  value={form.apolloId}
                  onChange={(e) => set("apolloId", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">External ID</label>
                <input
                  className="input font-mono text-xs"
                  placeholder="ext_..."
                  value={form.externalId}
                  onChange={(e) => set("externalId", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Lead"}
          </button>
          <Link href="/leads" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
