"use client";

import { useState, useEffect } from "react";
import { COUNTRIES, CAMPAIGN_TYPES } from "@/lib/constants";
import { Megaphone, Plus, Zap, PlayCircle, PauseCircle, CheckCircle } from "lucide-react";
import Link from "next/link";

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  targetCountries: string;
  leadsGenerated: number;
  createdAt: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((data) => { setCampaigns(data); setLoading(false); });
  }, []);

  const statusIcon = {
    Draft: <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />,
    Running: <PlayCircle className="w-4 h-4 text-green-600" />,
    Paused: <PauseCircle className="w-4 h-4 text-yellow-600" />,
    Completed: <CheckCircle className="w-4 h-4 text-blue-600" />,
  } as Record<string, React.ReactNode>;

  const statusColor: Record<string, string> = {
    Draft: "bg-slate-100 text-slate-600",
    Running: "bg-green-100 text-green-700",
    Paused: "bg-yellow-100 text-yellow-700",
    Completed: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-blue-600" />
            Campaigns
          </h1>
          <p className="text-sm text-slate-500">n8n-powered lead generation campaigns</p>
        </div>
        <Link href="/campaigns/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Campaign
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-slate-200 rounded mb-2" />
              <div className="h-3 bg-slate-100 rounded" />
            </div>
          ))
        ) : campaigns.length === 0 ? (
          <div className="col-span-3 card p-12 text-center text-slate-400">
            <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No campaigns yet.</p>
            <Link href="/campaigns/new" className="text-blue-600 hover:underline text-sm mt-1 inline-block">
              Create your first campaign
            </Link>
          </div>
        ) : (
          campaigns.map((c) => (
            <div key={c.id} className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{c.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {CAMPAIGN_TYPES.find((t) => t.value === c.type)?.label || c.type}
                  </p>
                </div>
                <span className={`badge ${statusColor[c.status] || "bg-slate-100 text-slate-600"}`}>
                  {statusIcon[c.status]} <span className="ml-1">{c.status}</span>
                </span>
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {c.targetCountries.split(",").map((country) => {
                  const c2 = COUNTRIES.find((x) => x.value === country.trim());
                  return (
                    <span key={country} className="badge bg-blue-50 text-blue-700 text-xs">
                      {c2?.flag} {c2?.label?.split(" - ")[0] || country.trim()}
                    </span>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-sm">
                  <Zap className="w-4 h-4 text-blue-500" />
                  <span className="font-bold text-slate-900">{c.leadsGenerated}</span>
                  <span className="text-slate-500 text-xs">leads</span>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(c.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
