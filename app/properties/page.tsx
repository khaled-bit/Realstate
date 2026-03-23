"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Plus, MapPin, BedDouble, Maximize } from "lucide-react";
import { PROPERTY_TYPES } from "@/lib/constants";

interface Property {
  id: string;
  title: string;
  compound?: string;
  status: string;
  location: string;
  lat?: number;
  lng?: number;
  bedrooms?: number;
  area?: number;
  type: string;
  price: number;
  currency: string;
  imageUrl?: string;
  _count: { leads: number };
}

const statusColor: Record<string, string> = {
  Available: "bg-green-100 text-green-700",
  Reserved: "bg-yellow-100 text-yellow-700",
  Sold: "bg-red-100 text-red-700",
};

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/properties")
      .then((r) => r.json())
      .then((data) => {
        setProperties(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  const available = properties.filter((p) => p.status === "Available").length;
  const reserved = properties.filter((p) => p.status === "Reserved").length;
  const sold = properties.filter((p) => p.status === "Sold").length;

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            Properties
          </h1>
          <p className="text-sm text-slate-500">Egyptian properties for Gulf & expat clients</p>
        </div>
        <Link href="/properties/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Property
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Available", value: available, color: "text-green-600", bg: "bg-green-50" },
          { label: "Reserved", value: reserved, color: "text-yellow-600", bg: "bg-yellow-50" },
          { label: "Sold", value: sold, color: "text-red-600", bg: "bg-red-50" },
        ].map((s) => (
          <div key={s.label} className={`card p-4 text-center ${s.bg}`}>
            <p className={`text-3xl font-bold ${s.color}`}>
              {loading ? "—" : s.value}
            </p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-40 bg-slate-100 rounded-t-xl" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {properties.map((p) => (
            <Link key={p.id} href={`/properties/${p.id}`} className="card hover:shadow-md transition-shadow">
              <div className="h-40 bg-gradient-to-br from-blue-100 to-slate-100 rounded-t-xl flex items-center justify-center">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover rounded-t-xl" />
                ) : (
                  <Building2 className="w-12 h-12 text-blue-300" />
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">{p.title}</h3>
                    {p.compound && <p className="text-xs text-slate-500">{p.compound}</p>}
                  </div>
                  <span className={`badge ${statusColor[p.status] || "bg-slate-100 text-slate-600"}`}>
                    {p.status}
                  </span>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="w-3 h-3" />
                    {p.location}
                  </span>
                  {p.lat && p.lng && (
                    <a
                      href={`https://www.google.com/maps?q=${p.lat},${p.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-0.5"
                    >
                      <MapPin className="w-3 h-3" /> Map
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-600 mb-3">
                  {p.bedrooms && (
                    <span className="flex items-center gap-1">
                      <BedDouble className="w-3.5 h-3.5" /> {p.bedrooms} beds
                    </span>
                  )}
                  {p.area && (
                    <span className="flex items-center gap-1">
                      <Maximize className="w-3.5 h-3.5" /> {p.area} m²
                    </span>
                  )}
                  <span className="badge bg-slate-100 text-slate-600">
                    {PROPERTY_TYPES.find((t) => t.value === p.type)?.label?.split(" - ")[0] || p.type}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <p className="font-bold text-blue-700">
                    {p.currency} {Number(p.price).toLocaleString()}
                  </p>
                  <span className="text-xs text-slate-400">
                    {p._count.leads} {p._count.leads === 1 ? "lead" : "leads"}
                  </span>
                </div>
              </div>
            </Link>
          ))}

          {properties.length === 0 && (
            <div className="col-span-3 card p-12 text-center text-slate-400">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No properties yet.</p>
              <Link href="/properties/new" className="text-blue-600 hover:underline text-sm mt-1 inline-block">
                Add your first property
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
