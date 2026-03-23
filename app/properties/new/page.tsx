"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PROPERTY_TYPES, CAIRO_AREAS } from "@/lib/constants";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export default function NewPropertyPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    titleAr: "",
    description: "",
    type: "Apartment",
    status: "Available",
    price: "",
    currency: "USD",
    area: "",
    bedrooms: "",
    bathrooms: "",
    location: "",
    compound: "",
    developer: "",
    imageUrl: "",
  });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      router.push("/properties");
    } else {
      setSaving(false);
      alert("Failed to save property");
    }
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/properties" className="text-slate-500 hover:text-slate-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Add Property</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card p-4">
          <h2 className="font-semibold text-slate-900 mb-4">Property Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Title (English) *</label>
              <input required className="input" placeholder="3BR Apartment in New Cairo" value={form.title} onChange={(e) => set("title", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Title (Arabic)</label>
              <input className="input" dir="rtl" placeholder="شقة 3 غرف في القاهرة الجديدة" value={form.titleAr} onChange={(e) => set("titleAr", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Type *</label>
              <select required className="input" value={form.type} onChange={(e) => set("type", e.target.value)}>
                {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
              <select className="input" value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option>Available</option>
                <option>Reserved</option>
                <option>Sold</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Price *</label>
              <input required type="number" className="input" placeholder="150000" value={form.price} onChange={(e) => set("price", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Currency</label>
              <select className="input" value={form.currency} onChange={(e) => set("currency", e.target.value)}>
                <option>USD</option><option>AED</option><option>SAR</option><option>EGP</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Area (m²)</label>
              <input type="number" className="input" placeholder="120" value={form.area} onChange={(e) => set("area", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Bedrooms</label>
              <input type="number" className="input" placeholder="3" value={form.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <h2 className="font-semibold text-slate-900 mb-4">Location</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Location / Area *</label>
              <select required className="input" value={form.location} onChange={(e) => set("location", e.target.value)}>
                <option value="">Select area...</option>
                {CAIRO_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Compound / Project</label>
              <input className="input" placeholder="Madinaty, Hyde Park..." value={form.compound} onChange={(e) => set("compound", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Developer</label>
              <input className="input" placeholder="Talaat Moustafa, SODIC..." value={form.developer} onChange={(e) => set("developer", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Image URL</label>
              <input className="input" placeholder="https://..." value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
            <textarea className="input resize-none" rows={3} placeholder="Property description..." value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Property"}
          </button>
          <Link href="/properties" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
