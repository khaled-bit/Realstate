"use client";

import { useState } from "react";
import { Settings, Save, Key, Globe, Bell } from "lucide-react";

export default function SettingsPage() {
  const [n8nUrl, setN8nUrl] = useState("http://localhost:5678");
  const [apolloKey, setApolloKey] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600" />
          Settings
        </h1>
        <p className="text-sm text-slate-500">Configure integrations and preferences</p>
      </div>

      <div className="space-y-4">
        {/* n8n Settings */}
        <div className="card p-4">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600" />
            n8n Connection
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">n8n Base URL</label>
              <input
                className="input"
                value={n8nUrl}
                onChange={(e) => setN8nUrl(e.target.value)}
                placeholder="http://localhost:5678"
              />
              <p className="text-xs text-slate-400 mt-1">
                Your n8n instance URL. Used to construct webhook trigger URLs.
              </p>
            </div>
          </div>
        </div>

        {/* Apollo Settings */}
        <div className="card p-4">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-600" />
            Apollo.io API
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Apollo API Key</label>
              <input
                type="password"
                className="input font-mono"
                value={apolloKey}
                onChange={(e) => setApolloKey(e.target.value)}
                placeholder="Enter your Apollo.io API key"
              />
              <p className="text-xs text-slate-400 mt-1">
                Used by n8n workflows to authenticate with Apollo.io for lead enrichment.
                Store this key in your n8n credentials, not here.
              </p>
            </div>
          </div>
        </div>

        {/* Target Markets */}
        <div className="card p-4">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-600" />
            About This App
          </h2>
          <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 space-y-2">
            <p><strong>Webhook URL (receive leads from n8n):</strong></p>
            <code className="block bg-white border border-slate-200 rounded px-3 py-2 text-xs font-mono">
              POST /api/webhooks/leads
            </code>
            <p className="text-xs text-slate-500 mt-2">
              Configure this endpoint in n8n as the final step of any lead scraping or Apollo workflow.
              Leads will automatically appear in the Leads tab.
            </p>
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="font-medium mb-2">n8n Apollo.io Field Mapping:</p>
              <div className="font-mono text-xs bg-white border border-slate-200 rounded p-3 space-y-1">
                <p><span className="text-blue-600">name</span>: person.name</p>
                <p><span className="text-blue-600">email</span>: person.email</p>
                <p><span className="text-blue-600">phone</span>: person.phone_numbers[0]</p>
                <p><span className="text-blue-600">country</span>: person.present_raw_address (map to: UAE/Saudi/Kuwait...)</p>
                <p><span className="text-blue-600">source</span>: "Apollo"</p>
                <p><span className="text-blue-600">apolloId</span>: person.id</p>
                <p><span className="text-blue-600">notes</span>: person.title + " at " + person.organization_name</p>
              </div>
            </div>
          </div>
        </div>

        <button onClick={handleSave} className="btn-primary flex items-center gap-2">
          <Save className="w-4 h-4" />
          {saved ? "Saved!" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
