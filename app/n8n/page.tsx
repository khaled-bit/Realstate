"use client";

import { useState, useEffect } from "react";
import { Zap, Plus, Play, CheckCircle2, AlertCircle, Trash2, ExternalLink } from "lucide-react";

interface N8nConfig {
  id: string;
  name: string;
  webhookUrl: string;
  description?: string;
  isActive: boolean;
  lastTriggered?: string;
  createdAt: string;
}

const DEFAULT_WORKFLOWS = [
  {
    name: "whatsapp-welcome",
    description: "🟢 Auto-send welcome WhatsApp when a new lead is created",
    webhookUrl: "",
  },
  {
    name: "whatsapp-send",
    description: "🟢 Send manual WhatsApp messages from the lead detail page",
    webhookUrl: "",
  },
  {
    name: "apollo-scrape-gulf",
    description: "Scrape Apollo.io for Egyptian expats in Gulf countries",
    webhookUrl: "",
  },
  {
    name: "linkedin-scrape",
    description: "Scrape LinkedIn for potential Egyptian real estate buyers",
    webhookUrl: "",
  },
];

export default function N8nPage() {
  const [configs, setConfigs] = useState<N8nConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [triggerResults, setTriggerResults] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ name: "", webhookUrl: "", description: "" });

  const fetchConfigs = async () => {
    const res = await fetch("/api/n8n/configs");
    const data = await res.json();
    setConfigs(data);
    setLoading(false);
  };

  useEffect(() => { fetchConfigs(); }, []);

  const handleSave = async () => {
    if (!form.name || !form.webhookUrl) return;
    await fetch("/api/n8n/configs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setAdding(false);
    setForm({ name: "", webhookUrl: "", description: "" });
    fetchConfigs();
  };

  const handleTrigger = async (name: string, payload = {}) => {
    setTriggering(name);
    const res = await fetch("/api/n8n/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workflowName: name, payload }),
    });
    const data = await res.json();
    setTriggerResults((prev) => ({
      ...prev,
      [name]: data.success ? "✅ Triggered successfully" : `❌ ${data.error || "Failed"}`,
    }));
    setTriggering(null);
    fetchConfigs();
    setTimeout(() => setTriggerResults((prev) => { const n = { ...prev }; delete n[name]; return n; }), 5000);
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-blue-600" />
            n8n Workflows
          </h1>
          <p className="text-sm text-slate-500">Connect n8n to scrape, enrich, and push leads</p>
        </div>
        <button onClick={() => setAdding(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Webhook
        </button>
      </div>

      {/* Webhook endpoint info */}
      <div className="card p-4 mb-6 border-blue-200 bg-blue-50">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <ExternalLink className="w-4 h-4" />
          n8n → CRM Webhook (Receive Leads)
        </h3>
        <p className="text-sm text-blue-800 mb-2">
          In n8n, use an <strong>HTTP Request node</strong> to POST leads to this CRM:
        </p>
        <code className="block bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm font-mono text-blue-900">
          POST http://YOUR_APP_URL/api/webhooks/leads
        </code>
        <p className="text-xs text-blue-700 mt-2">
          Accepts single lead or array of leads. Fields: name, email, phone, whatsapp, country, city, source, budget, propertyType, notes, apolloId
        </p>
      </div>

      {/* Add form */}
      {adding && (
        <div className="card p-4 mb-4 border-2 border-blue-200">
          <h3 className="font-semibold text-slate-900 mb-3">Add n8n Webhook</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Workflow Name (unique key)</label>
              <input
                className="input"
                placeholder="apollo-scrape-gulf"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">n8n Webhook URL</label>
              <input
                className="input"
                placeholder="http://localhost:5678/webhook/..."
                value={form.webhookUrl}
                onChange={(e) => setForm((p) => ({ ...p, webhookUrl: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
              <input
                className="input"
                placeholder="What does this workflow do?"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="btn-primary">Save</button>
            <button onClick={() => setAdding(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {/* Quick add default workflows */}
      {configs.length === 0 && !adding && (
        <div className="card p-4 mb-4">
          <h3 className="font-semibold text-slate-900 mb-1">Quick Setup — Common Workflows</h3>
          <p className="text-xs text-slate-500 mb-3">Click to pre-fill the webhook URL template for common workflows</p>
          <div className="space-y-2">
            {DEFAULT_WORKFLOWS.map((w) => (
              <button
                key={w.name}
                onClick={() => {
                  setForm({ name: w.name, description: w.description, webhookUrl: `http://localhost:5678/webhook/${w.name}` });
                  setAdding(true);
                }}
                className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <p className="text-sm font-medium text-slate-900">{w.name}</p>
                <p className="text-xs text-slate-500">{w.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Configured workflows */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-slate-200 rounded mb-2 w-1/3" />
              <div className="h-3 bg-slate-100 rounded w-2/3" />
            </div>
          ))
        ) : configs.length === 0 ? (
          <div className="card p-8 text-center text-slate-400">
            <Zap className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No workflows configured yet.</p>
          </div>
        ) : (
          configs.map((config) => (
            <div key={config.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${config.isActive ? "bg-green-500" : "bg-slate-300"}`} />
                    <h3 className="font-semibold text-slate-900">{config.name}</h3>
                  </div>
                  {config.description && (
                    <p className="text-xs text-slate-500 mb-1">{config.description}</p>
                  )}
                  <p className="text-xs font-mono text-slate-400 truncate">{config.webhookUrl}</p>
                  {config.lastTriggered && (
                    <p className="text-xs text-slate-400 mt-1">
                      Last triggered: {new Date(config.lastTriggered).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {triggerResults[config.name] && (
                    <span className="text-xs">{triggerResults[config.name]}</span>
                  )}
                  <button
                    onClick={() => handleTrigger(config.name, { targetCountries: "UAE,Saudi,Kuwait,Qatar,EgyptAbroad" })}
                    disabled={triggering === config.name || !config.isActive}
                    className="btn-primary flex items-center gap-1.5 text-xs px-3 py-1.5"
                  >
                    {triggering === config.name ? (
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                    Trigger
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* WhatsApp Integration Guide */}
      <div className="card p-4 mt-6 border-green-200 bg-green-50">
        <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-700" />
          WhatsApp Integration Setup
        </h3>
        <div className="space-y-3 text-sm text-green-900">
          <p className="text-xs text-green-700 font-medium">You need 2 workflows: <strong>whatsapp-welcome</strong> (auto on new lead) and <strong>whatsapp-send</strong> (manual send)</p>

          <div className="bg-white rounded-lg p-3 border border-green-200 text-slate-700 space-y-2">
            <p className="font-semibold text-xs text-slate-900">n8n Workflow Structure (both workflows):</p>
            <div className="font-mono text-xs space-y-1">
              <div className="flex items-center gap-2"><span className="bg-green-100 text-green-800 px-2 py-0.5 rounded">1</span> Webhook Trigger (POST)</div>
              <div className="flex items-center gap-2"><span className="bg-green-100 text-green-800 px-2 py-0.5 rounded">2</span> WhatsApp Business Cloud API node</div>
              <div className="ml-6 text-slate-500">— or — Twilio WhatsApp node</div>
              <div className="ml-6 text-slate-500">— or — HTTP Request to 360Dialog / WATI</div>
              <div className="flex items-center gap-2"><span className="bg-green-100 text-green-800 px-2 py-0.5 rounded">3</span> Set message: <code className="bg-slate-100 px-1 rounded">{`{{$json.message}}`}</code> to phone: <code className="bg-slate-100 px-1 rounded">{`{{$json.phone}}`}</code></div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <p className="font-semibold text-slate-900 mb-1">whatsapp-welcome</p>
              <p className="text-slate-600">Triggered automatically when a lead is created. Receives: <code className="bg-slate-100 px-1 rounded">name, phone, message, country, budget</code></p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <p className="font-semibold text-slate-900 mb-1">whatsapp-send</p>
              <p className="text-slate-600">Triggered from the lead detail page. Receives: <code className="bg-slate-100 px-1 rounded">leadId, name, phone, channel, message</code></p>
            </div>
          </div>

          <p className="text-xs text-green-700">
            💡 <strong>Free option:</strong> Use Meta&apos;s WhatsApp Business Cloud API (free 1000 conversations/month).
            In n8n: Add credential → WhatsApp Business Cloud → paste your Phone Number ID + Token from Meta Developer Dashboard.
          </p>
        </div>
      </div>

      {/* Apollo.io Integration Guide */}
      <div className="card p-4 mt-6">
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          Apollo.io Integration Guide
        </h3>
        <div className="space-y-3 text-sm text-slate-700">
          <div className="flex gap-3">
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs shrink-0 font-bold">1</span>
            <div>
              <p className="font-medium">Create n8n workflow with Apollo.io node</p>
              <p className="text-xs text-slate-500">Use Apollo Search People API with filters: nationality=Egyptian, location=UAE/Saudi/Kuwait/Qatar</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs shrink-0 font-bold">2</span>
            <div>
              <p className="font-medium">Add HTTP Request node at the end</p>
              <p className="text-xs text-slate-500">POST to <code className="bg-slate-100 px-1 rounded">YOUR_APP/api/webhooks/leads</code> with the mapped lead data</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs shrink-0 font-bold">3</span>
            <div>
              <p className="font-medium">Register the webhook URL here</p>
              <p className="text-xs text-slate-500">Add the n8n webhook trigger URL above so this app can call it on demand</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs shrink-0 font-bold">4</span>
            <div>
              <p className="font-medium">Click Trigger to run on demand</p>
              <p className="text-xs text-slate-500">Or schedule it in n8n with a Cron trigger. Leads will appear in the Leads tab automatically.</p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <h4 className="font-medium text-slate-900 text-sm mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            Web Scraping Setup
          </h4>
          <p className="text-xs text-slate-600">
            Create a workflow with n8n&apos;s <strong>HTTP Request</strong> + <strong>HTML Extract</strong> nodes to scrape{" "}
            property portals (Aqarmap, OLX Egypt, Bayut). Map fields to the lead schema and POST to{" "}
            <code className="bg-slate-100 px-1 rounded">/api/webhooks/leads</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
