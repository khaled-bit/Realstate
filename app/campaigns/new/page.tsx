"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { COUNTRIES, CAMPAIGN_TYPES } from "@/lib/constants";
import { ArrowLeft, Save, Zap } from "lucide-react";
import Link from "next/link";

export default function NewCampaignPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "Apollo",
    targetCountries: [] as string[],
    n8nWorkflowId: "",
  });

  const toggleCountry = (val: string) => {
    setForm((prev) => ({
      ...prev,
      targetCountries: prev.targetCountries.includes(val)
        ? prev.targetCountries.filter((c) => c !== val)
        : [...prev.targetCountries, val],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.targetCountries.length === 0) {
      alert("Select at least one target country");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      router.push("/campaigns");
    } else {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/campaigns" className="text-slate-500 hover:text-slate-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">New Campaign</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card p-4">
          <h2 className="font-semibold text-slate-900 mb-4">Campaign Setup</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Campaign Name *</label>
              <input required className="input" placeholder="Gulf Buyers Q1 2025" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Campaign Type *</label>
              <div className="grid grid-cols-2 gap-2">
                {CAMPAIGN_TYPES.map((t) => (
                  <button
                    type="button"
                    key={t.value}
                    onClick={() => setForm((p) => ({ ...p, type: t.value }))}
                    className={`p-3 text-sm rounded-lg border text-left transition-all ${
                      form.type === t.value
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-600 hover:border-slate-400"
                    }`}
                  >
                    <div className="font-medium">{t.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <h2 className="font-semibold text-slate-900 mb-1">Target Countries *</h2>
          <p className="text-xs text-slate-500 mb-3">Select which markets to target</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {COUNTRIES.map((c) => (
              <button
                type="button"
                key={c.value}
                onClick={() => toggleCountry(c.value)}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm transition-all ${
                  form.targetCountries.includes(c.value)
                    ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                    : "border-slate-200 text-slate-600 hover:border-slate-400"
                }`}
              >
                <span>{c.flag}</span>
                <span className="text-xs">{c.label.split(" - ")[0]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <h2 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-600" /> n8n Workflow
          </h2>
          <p className="text-xs text-slate-500 mb-3">Link to an n8n workflow name (configured in Settings)</p>
          <input
            className="input"
            placeholder="apollo-scrape-gulf"
            value={form.n8nWorkflowId}
            onChange={(e) => setForm((p) => ({ ...p, n8nWorkflowId: e.target.value }))}
          />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" /> {saving ? "Creating..." : "Create Campaign"}
          </button>
          <Link href="/campaigns" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
