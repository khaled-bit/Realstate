"use client";

import { useEffect, useState, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { Phone, PhoneCall, PhoneIncoming, PhoneMissed, Plus, Search, Clock, FileText } from "lucide-react";
import Link from "next/link";

type Call = {
  id: string;
  direction: string;
  duration: number | null;
  notes: string | null;
  status: string;
  recordingUrl: string | null;
  createdAt: string;
  lead: { id: string; name: string; phone: string | null };
  agent: { id: string; name: string } | null;
};

export default function CallingPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLeads, setSearchLeads] = useState("");
  const [leads, setLeads] = useState<Array<{ id: string; name: string; phone: string | null }>>([]);
  const [searchResults, setSearchResults] = useState<typeof leads>([]);
  const [calling, setCalling] = useState(false);
  const [callResult, setCallResult] = useState<string | null>(null);
  const [showLogForm, setShowLogForm] = useState(false);
  const [logForm, setLogForm] = useState({
    leadId: "",
    leadName: "",
    direction: "Outbound",
    duration: "",
    notes: "",
    status: "Completed",
  });
  const [logging, setLogging] = useState(false);

  const fetchCalls = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/calls");
      const data = await res.json();
      setCalls(data.calls || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  useEffect(() => {
    const fetchLeads = async () => {
      const res = await fetch("/api/leads?limit=500");
      const data = await res.json();
      setLeads(data.leads || []);
    };
    fetchLeads();
  }, []);

  useEffect(() => {
    if (!searchLeads.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchLeads.toLowerCase();
    setSearchResults(leads.filter((l) => l.name.toLowerCase().includes(q) || l.phone?.includes(q)).slice(0, 5));
  }, [searchLeads, leads]);

  const initiateCall = async (leadId: string, to: string) => {
    setCalling(true);
    setCallResult(null);
    try {
      const res = await fetch("/api/twilio/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, to }),
      });
      const data = await res.json();
      if (data.callSid) {
        setCallResult(`Call initiated. SID: ${data.callSid}`);
        setSearchLeads("");
        setSearchResults([]);
        fetchCalls();
      } else {
        setCallResult(`Error: ${data.error || "Failed to initiate call"}. ${data.note || ""}`);
      }
    } catch {
      setCallResult("Failed to initiate call");
    } finally {
      setCalling(false);
    }
  };

  const logCall = async () => {
    if (!logForm.leadId || !logForm.status) return;
    setLogging(true);
    try {
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logForm),
      });
      const call = await res.json();
      setCalls((prev) => [call, ...prev]);
      setShowLogForm(false);
      setLogForm({ leadId: "", leadName: "", direction: "Outbound", duration: "", notes: "", status: "Completed" });
    } finally {
      setLogging(false);
    }
  };

  const StatusIcon = ({ status, direction }: { status: string; direction: string }) => {
    if (status === "Completed") return <PhoneCall className="w-4 h-4 text-green-500" />;
    if (status === "Failed" || status === "Busy" || status === "NoAnswer") return <PhoneMissed className="w-4 h-4 text-red-500" />;
    if (direction === "Inbound") return <PhoneIncoming className="w-4 h-4 text-blue-500" />;
    return <Phone className="w-4 h-4 text-slate-500" />;
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Calling</h1>
          <p className="text-slate-500 text-sm mt-1">Call logs and click-to-call</p>
        </div>
        <button
          onClick={() => setShowLogForm(!showLogForm)}
          className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Log Call
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main: call log */}
        <div className="lg:col-span-2 space-y-4">
          {/* Log call form */}
          {showLogForm && (
            <div className="card">
              <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Log a Call
              </h2>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Lead *</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search lead..."
                      value={logForm.leadName}
                      onChange={(e) => {
                        setLogForm({ ...logForm, leadName: e.target.value, leadId: "" });
                        const q = e.target.value.toLowerCase();
                        setSearchResults(leads.filter((l) => l.name.toLowerCase().includes(q)).slice(0, 5));
                      }}
                      className="input w-full"
                    />
                    {logForm.leadName && !logForm.leadId && searchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg">
                        {searchResults.map((lead) => (
                          <button
                            key={lead.id}
                            onClick={() => {
                              setLogForm({ ...logForm, leadId: lead.id, leadName: lead.name });
                              setSearchResults([]);
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                          >
                            {lead.name} {lead.phone && <span className="text-slate-400 text-xs">· {lead.phone}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={logForm.direction}
                    onChange={(e) => setLogForm({ ...logForm, direction: e.target.value })}
                    className="input"
                  >
                    <option value="Outbound">Outbound</option>
                    <option value="Inbound">Inbound</option>
                  </select>
                  <select
                    value={logForm.status}
                    onChange={(e) => setLogForm({ ...logForm, status: e.target.value })}
                    className="input"
                  >
                    <option value="Completed">Completed</option>
                    <option value="Failed">Failed</option>
                    <option value="Busy">Busy</option>
                    <option value="NoAnswer">No Answer</option>
                  </select>
                </div>
                <input
                  type="number"
                  placeholder="Duration (seconds)"
                  value={logForm.duration}
                  onChange={(e) => setLogForm({ ...logForm, duration: e.target.value })}
                  className="input w-full"
                />
                <textarea
                  placeholder="Notes"
                  value={logForm.notes}
                  onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
                  className="input w-full h-20 resize-none"
                />
                <div className="flex gap-2">
                  <button onClick={logCall} disabled={logging || !logForm.leadId} className="btn-primary flex-1">
                    {logging ? "Saving..." : "Save Call"}
                  </button>
                  <button onClick={() => setShowLogForm(false)} className="btn-secondary px-4">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Call history */}
          <div>
            <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide mb-3">Recent Calls</h2>
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="card animate-pulse h-16" />
                ))}
              </div>
            ) : calls.length === 0 ? (
              <div className="card text-center py-12 text-slate-400">
                <Phone className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>No call history yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {calls.map((call) => (
                  <div key={call.id} className="card flex items-start gap-3">
                    <StatusIcon status={call.status} direction={call.direction} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/leads/${call.lead.id}`} className="font-medium text-slate-900 hover:text-blue-600 text-sm">
                          {call.lead.name}
                        </Link>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          call.status === "Completed" ? "bg-green-100 text-green-700" :
                          call.status === "Failed" || call.status === "Busy" ? "bg-red-100 text-red-700" :
                          "bg-slate-100 text-slate-600"
                        }`}>
                          {call.direction} · {call.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500 flex-wrap">
                        <span>{format(parseISO(call.createdAt), "MMM d, h:mm a")}</span>
                        {call.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(call.duration)}
                          </span>
                        )}
                        {call.agent && <span>{call.agent.name}</span>}
                        {call.lead.phone && <span>{call.lead.phone}</span>}
                      </div>
                      {call.notes && (
                        <p className="text-xs text-slate-500 mt-1 italic">{call.notes}</p>
                      )}
                    </div>
                    {call.recordingUrl && (
                      <a
                        href={call.recordingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline shrink-0"
                      >
                        Recording
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Click-to-call */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-green-500" />
              Click-to-Call
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search lead to call..."
                value={searchLeads}
                onChange={(e) => setSearchLeads(e.target.value)}
                className="input w-full pl-9"
              />
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 space-y-1">
                {searchResults.map((lead) => (
                  <div key={lead.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{lead.name}</p>
                      <p className="text-xs text-slate-500">{lead.phone || "No phone"}</p>
                    </div>
                    {lead.phone && (
                      <button
                        onClick={() => initiateCall(lead.id, lead.phone!)}
                        disabled={calling}
                        className="flex items-center gap-1 text-xs bg-green-600 text-white px-2 py-1 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Phone className="w-3 h-3" />
                        Call
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {callResult && (
              <div className={`mt-3 p-2 rounded-lg text-xs ${
                callResult.startsWith("Error") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
              }`}>
                {callResult}
              </div>
            )}
          </div>

          {/* Twilio info */}
          <div className="card bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-blue-900 text-sm mb-2">Twilio Setup</h3>
            <p className="text-xs text-blue-700 mb-2">To enable browser calling, configure:</p>
            <ul className="text-xs text-blue-700 space-y-1">
              {["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER", "TWILIO_TWIML_APP_SID"].map((v) => (
                <li key={v} className="font-mono bg-blue-100 px-2 py-0.5 rounded">{v}</li>
              ))}
            </ul>
            <a
              href="https://console.twilio.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline mt-2 block"
            >
              Open Twilio Console →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
