"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PROPERTY_TYPES } from "@/lib/constants";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

const MapPicker = dynamic(() => import("@/components/MapPicker"), { ssr: false });

export default function NewPropertyPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", titleAr: "", description: "",
    type: "Apartment", status: "Available",
    price: "", currency: "USD",
    area: "", bedrooms: "", bathrooms: "",
    location: "", compound: "", developer: "", imageUrl: "",
    lat: null as number | null,
    lng: null as number | null,
  });

  const set = (field: string, value: string | number | null) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleMapChange = (lat: number, lng: number, address: string) => {
    setForm((prev) => ({ ...prev, lat, lng, location: prev.location || address }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) router.push("/properties");
    else { setSaving(false); alert("Failed to save property"); }
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/properties" className="text-slate-500 hover:text-slate-900"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-2xl font-bold text-slate-900">Add Property</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Details */}
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
                <option>Available</option><option>Reserved</option><option>Sold</option>
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
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Bathrooms</label>
              <input type="number" className="input" placeholder="2" value={form.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
            <textarea className="input resize-none" rows={3} placeholder="Property description..." value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
        </div>

        {/* Location — Map Picker */}
        <div className="card p-4">
          <h2 className="font-semibold text-slate-900 mb-1">Location</h2>
          <p className="text-xs text-slate-500 mb-4">Search an address or click the map to drop a pin. The address fills automatically.</p>

          <MapPicker lat={form.lat} lng={form.lng} address={form.location} onChange={handleMapChange} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Area Label *</label>
              <input required className="input" placeholder="New Cairo, Sheikh Zayed..." value={form.location} onChange={(e) => set("location", e.target.value)} />
              <p className="text-xs text-slate-400 mt-1">Short label shown on listing cards</p>
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

          {form.lat && form.lng && (
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              Pin set — {form.lat.toFixed(5)}, {form.lng.toFixed(5)}
            </div>
          )}
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
