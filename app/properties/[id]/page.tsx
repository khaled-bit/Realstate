"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PROPERTY_TYPES } from "@/lib/constants";
import { ArrowLeft, Edit2, Save, X, MapPin, BedDouble, Maximize, Building2, Trash2, Users, ExternalLink } from "lucide-react";
import dynamic from "next/dynamic";

const MapPicker = dynamic(() => import("@/components/MapPicker"), { ssr: false });

interface Property {
  id: string; title: string; titleAr?: string; description?: string;
  type: string; status: string; price: number; currency: string;
  area?: number; bedrooms?: number; bathrooms?: number;
  location: string; compound?: string; developer?: string; imageUrl?: string;
  lat?: number; lng?: number; createdAt: string;
  leads: { id: string; interest: string; lead: { id: string; name: string; country: string; status: string; phone?: string } }[];
}

const statusColor: Record<string, string> = {
  Available: "bg-green-100 text-green-700",
  Reserved: "bg-yellow-100 text-yellow-700",
  Sold: "bg-red-100 text-red-700",
};

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Property>>({});

  useEffect(() => {
    fetch(`/api/properties/${id}`).then(r => { if (!r.ok) { router.push("/properties"); return; } return r.json(); }).then(d => { if (d) { setProperty(d); setForm(d); setLoading(false); } });
  }, [id, router]);

  const set = (field: string, value: unknown) => setForm(p => ({ ...p, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch(`/api/properties/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { const d = await res.json(); setProperty(d); setForm(d); setEditing(false); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this property? This cannot be undone.")) return;
    await fetch(`/api/properties/${id}`, { method: "DELETE" });
    router.push("/properties");
  };

  if (loading) return <div className="p-6 animate-pulse"><div className="h-8 bg-slate-200 rounded w-48 mb-4" /><div className="h-64 bg-slate-100 rounded-xl" /></div>;
  if (!property) return null;

  return (
    <div className="p-4 md:p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/properties" className="text-slate-500 hover:text-slate-900 shrink-0"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 truncate">{property.title}</h1>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className={`badge ${statusColor[property.status] || "bg-slate-100 text-slate-600"}`}>{property.status}</span>
              <span className="text-xs text-slate-500">{PROPERTY_TYPES.find(t => t.value === property.type)?.label || property.type}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {editing ? (
            <>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-1 text-xs px-3"><Save className="w-4 h-4" /><span className="hidden sm:inline">{saving ? "Saving..." : "Save"}</span></button>
              <button onClick={() => { setEditing(false); setForm(property); }} className="btn-secondary flex items-center gap-1 text-xs px-3"><X className="w-4 h-4" /></button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="btn-secondary flex items-center gap-1 text-xs px-3"><Edit2 className="w-4 h-4" /><span className="hidden sm:inline">Edit</span></button>
              <button onClick={handleDelete} className="btn-secondary text-red-600 hover:bg-red-50 px-3"><Trash2 className="w-4 h-4" /></button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Image */}
          <div className="card overflow-hidden">
            {property.imageUrl ? (
              <img src={property.imageUrl} alt={property.title} className="w-full h-56 object-cover" />
            ) : (
              <div className="h-56 bg-gradient-to-br from-blue-100 to-slate-100 flex items-center justify-center">
                <Building2 className="w-16 h-16 text-blue-200" />
              </div>
            )}
          </div>

          {/* Details card */}
          <div className="card p-4">
            <h2 className="font-semibold text-slate-900 mb-4">Property Details</h2>
            {editing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2"><label className="text-xs text-slate-500 block mb-1">Title</label><input className="input" value={form.title || ""} onChange={e => set("title", e.target.value)} /></div>
                <div className="sm:col-span-2"><label className="text-xs text-slate-500 block mb-1">Title (Arabic)</label><input className="input" dir="rtl" value={form.titleAr || ""} onChange={e => set("titleAr", e.target.value)} /></div>
                <div><label className="text-xs text-slate-500 block mb-1">Type</label><select className="input" value={form.type || ""} onChange={e => set("type", e.target.value)}>{PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                <div><label className="text-xs text-slate-500 block mb-1">Status</label><select className="input" value={form.status || ""} onChange={e => set("status", e.target.value)}><option>Available</option><option>Reserved</option><option>Sold</option></select></div>
                <div><label className="text-xs text-slate-500 block mb-1">Price</label><input type="number" className="input" value={form.price || ""} onChange={e => set("price", parseFloat(e.target.value))} /></div>
                <div><label className="text-xs text-slate-500 block mb-1">Currency</label><select className="input" value={form.currency || "USD"} onChange={e => set("currency", e.target.value)}><option>USD</option><option>AED</option><option>SAR</option><option>EGP</option></select></div>
                <div><label className="text-xs text-slate-500 block mb-1">Area (m²)</label><input type="number" className="input" value={form.area || ""} onChange={e => set("area", parseFloat(e.target.value))} /></div>
                <div><label className="text-xs text-slate-500 block mb-1">Bedrooms</label><input type="number" className="input" value={form.bedrooms || ""} onChange={e => set("bedrooms", parseInt(e.target.value))} /></div>
                <div><label className="text-xs text-slate-500 block mb-1">Bathrooms</label><input type="number" className="input" value={form.bathrooms || ""} onChange={e => set("bathrooms", parseInt(e.target.value))} /></div>
                <div><label className="text-xs text-slate-500 block mb-1">Compound</label><input className="input" value={form.compound || ""} onChange={e => set("compound", e.target.value)} /></div>
                <div><label className="text-xs text-slate-500 block mb-1">Developer</label><input className="input" value={form.developer || ""} onChange={e => set("developer", e.target.value)} /></div>
                <div className="sm:col-span-2"><label className="text-xs text-slate-500 block mb-1">Image URL</label><input className="input" value={form.imageUrl || ""} onChange={e => set("imageUrl", e.target.value)} /></div>
                <div className="sm:col-span-2"><label className="text-xs text-slate-500 block mb-1">Description</label><textarea className="input resize-none" rows={3} value={form.description || ""} onChange={e => set("description", e.target.value)} /></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-xs text-slate-500">Price</p><p className="font-bold text-blue-700 text-lg">{property.currency} {Number(property.price).toLocaleString()}</p></div>
                <div><p className="text-xs text-slate-500">Type</p><p className="font-medium">{PROPERTY_TYPES.find(t => t.value === property.type)?.label || property.type}</p></div>
                {property.area && <div><p className="text-xs text-slate-500 flex items-center gap-1"><Maximize className="w-3 h-3" /> Area</p><p>{property.area} m²</p></div>}
                {property.bedrooms && <div><p className="text-xs text-slate-500 flex items-center gap-1"><BedDouble className="w-3 h-3" /> Bedrooms</p><p>{property.bedrooms}</p></div>}
                {property.bathrooms && <div><p className="text-xs text-slate-500">Bathrooms</p><p>{property.bathrooms}</p></div>}
                {property.compound && <div><p className="text-xs text-slate-500">Compound</p><p>{property.compound}</p></div>}
                {property.developer && <div><p className="text-xs text-slate-500">Developer</p><p>{property.developer}</p></div>}
                {property.description && <div className="col-span-2"><p className="text-xs text-slate-500 mb-1">Description</p><p className="text-slate-700">{property.description}</p></div>}
              </div>
            )}
          </div>

          {/* Map */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-600" /> Location</h2>
              {property.lat && property.lng && (
                <a href={`https://www.google.com/maps?q=${property.lat},${property.lng}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  Google Maps <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            {editing ? (
              <>
                <MapPicker lat={form.lat} lng={form.lng} address={form.location} onChange={(lat, lng, address) => { set("lat", lat); set("lng", lng); if (!form.location) set("location", address); }} />
                <div className="mt-3"><label className="text-xs text-slate-500 block mb-1">Area Label</label><input className="input" value={form.location || ""} onChange={e => set("location", e.target.value)} /></div>
              </>
            ) : (
              property.lat && property.lng ? (
                <MapPicker lat={property.lat} lng={property.lng} address={property.location} onChange={() => {}} />
              ) : (
                <div className="h-24 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 text-sm">
                  <MapPin className="w-4 h-4 mr-2" /> No location set — click Edit to add
                </div>
              )
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick stats */}
          <div className="card p-4">
            <h2 className="font-semibold text-slate-900 mb-3">Overview</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Status</span><span className={`badge ${statusColor[property.status] || ""}`}>{property.status}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Price</span><span className="font-semibold text-blue-700">{property.currency} {Number(property.price).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Location</span><span className="text-slate-700">{property.location}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Listed</span><span className="text-slate-500 text-xs">{new Date(property.createdAt).toLocaleDateString()}</span></div>
            </div>
          </div>

          {/* Linked leads */}
          <div className="card p-4">
            <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> Interested Leads ({property.leads?.length || 0})</h2>
            {property.leads?.length === 0 ? (
              <p className="text-xs text-slate-400">No leads linked yet.</p>
            ) : (
              <div className="space-y-2">
                {property.leads?.map(lp => (
                  <Link key={lp.id} href={`/leads/${lp.lead.id}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-700">{lp.lead.name.charAt(0)}</div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{lp.lead.name}</p>
                        <p className="text-xs text-slate-500">{lp.interest}</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">{lp.lead.status}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
