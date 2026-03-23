"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, X, GitBranch, Users, Trash2, ToggleLeft, ToggleRight, ChevronDown, ChevronUp } from "lucide-react";

type SequenceStep = {
  id?: string;
  stepNumber: number;
  delayDays: number;
  channel: string;
  subject: string;
  body: string;
};

type Sequence = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  steps: SequenceStep[];
  _count: { enrollments: number };
};

export default function SequencesPage() {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [enrollModal, setEnrollModal] = useState<string | null>(null);
  const [leads, setLeads] = useState<Array<{ id: string; name: string; status: string }>>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [enrolling, setEnrolling] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    steps: [{ stepNumber: 1, delayDays: 1, channel: "WhatsApp", subject: "", body: "" }] as SequenceStep[],
  });
  const [saving, setSaving] = useState(false);

  const fetchSequences = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sequences");
      const data = await res.json();
      setSequences(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSequences();
  }, [fetchSequences]);

  const fetchLeads = async () => {
    const res = await fetch("/api/leads?limit=500");
    const data = await res.json();
    setLeads(data.leads || []);
  };

  const addStep = () => {
    setForm((f) => ({
      ...f,
      steps: [
        ...f.steps,
        {
          stepNumber: f.steps.length + 1,
          delayDays: 1,
          channel: "WhatsApp",
          subject: "",
          body: "",
        },
      ],
    }));
  };

  const removeStep = (idx: number) => {
    setForm((f) => ({
      ...f,
      steps: f.steps
        .filter((_, i) => i !== idx)
        .map((s, i) => ({ ...s, stepNumber: i + 1 })),
    }));
  };

  const updateStep = (idx: number, field: string, value: string | number) => {
    setForm((f) => ({
      ...f,
      steps: f.steps.map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
    }));
  };

  const createSequence = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/sequences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const seq = await res.json();
      setSequences((prev) => [seq, ...prev]);
      setShowCreate(false);
      setForm({ name: "", description: "", steps: [{ stepNumber: 1, delayDays: 1, channel: "WhatsApp", subject: "", body: "" }] });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (seq: Sequence) => {
    setSequences((prev) =>
      prev.map((s) => (s.id === seq.id ? { ...s, isActive: !s.isActive } : s))
    );
    await fetch(`/api/sequences/${seq.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !seq.isActive }),
    });
  };

  const deleteSequence = async (id: string) => {
    if (!confirm("Delete this sequence? Enrolled leads will be unenrolled.")) return;
    setSequences((prev) => prev.filter((s) => s.id !== id));
    await fetch(`/api/sequences/${id}`, { method: "DELETE" });
  };

  const openEnroll = async (seqId: string) => {
    setEnrollModal(seqId);
    setSelectedLeadIds([]);
    await fetchLeads();
  };

  const enrollLeads = async () => {
    if (!enrollModal || selectedLeadIds.length === 0) return;
    setEnrolling(true);
    try {
      await fetch(`/api/sequences/${enrollModal}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds: selectedLeadIds }),
      });
      setEnrollModal(null);
      fetchSequences();
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sequences</h1>
          <p className="text-slate-500 text-sm mt-1">Automated drip campaigns for leads</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Sequence
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="card mb-6">
          <h2 className="font-semibold text-slate-900 mb-4">Create Sequence</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Sequence name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
                autoFocus
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-700 text-sm">Steps</p>
                <button onClick={addStep} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  <Plus className="w-3 h-3" />
                  Add Step
                </button>
              </div>
              {form.steps.map((step, idx) => (
                <div key={idx} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500">Step {step.stepNumber}</span>
                    {form.steps.length > 1 && (
                      <button onClick={() => removeStep(idx)} className="text-slate-400 hover:text-red-600">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div>
                      <label className="text-xs text-slate-500">Delay (days)</label>
                      <input
                        type="number"
                        value={step.delayDays}
                        onChange={(e) => updateStep(idx, "delayDays", parseInt(e.target.value) || 1)}
                        className="input w-full mt-0.5"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Channel</label>
                      <select
                        value={step.channel}
                        onChange={(e) => updateStep(idx, "channel", e.target.value)}
                        className="input w-full mt-0.5"
                      >
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Email">Email</option>
                        <option value="SMS">SMS</option>
                      </select>
                    </div>
                    {step.channel === "Email" && (
                      <div>
                        <label className="text-xs text-slate-500">Subject</label>
                        <input
                          type="text"
                          placeholder="Email subject"
                          value={step.subject}
                          onChange={(e) => updateStep(idx, "subject", e.target.value)}
                          className="input w-full mt-0.5"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Message body</label>
                    <textarea
                      placeholder="Use {{name}} and {{country}} as variables"
                      value={step.body}
                      onChange={(e) => updateStep(idx, "body", e.target.value)}
                      className="input w-full mt-0.5 h-20 resize-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={createSequence} disabled={saving || !form.name.trim()} className="btn-primary flex-1">
                {saving ? "Creating..." : "Create Sequence"}
              </button>
              <button onClick={() => setShowCreate(false)} className="btn-secondary px-4">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Sequences list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card animate-pulse h-24" />
          ))}
        </div>
      ) : sequences.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No sequences yet</p>
          <p className="text-sm mt-1">Create your first drip sequence above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sequences.map((seq) => (
            <div key={seq.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{seq.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${seq.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {seq.isActive ? "Active" : "Paused"}
                    </span>
                  </div>
                  {seq.description && (
                    <p className="text-sm text-slate-500 mt-0.5">{seq.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <span>{seq.steps.length} steps</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {seq._count.enrollments} enrolled
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openEnroll(seq.id)}
                    className="text-xs btn-secondary px-3 py-1.5 flex items-center gap-1"
                  >
                    <Users className="w-3 h-3" />
                    Enroll
                  </button>
                  <button
                    onClick={() => toggleActive(seq)}
                    className={`text-slate-400 hover:text-slate-600 transition-colors`}
                  >
                    {seq.isActive ? (
                      <ToggleRight className="w-5 h-5 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => setExpandedId(expandedId === seq.id ? null : seq.id)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    {expandedId === seq.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => deleteSequence(seq.id)}
                    className="text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {expandedId === seq.id && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  {seq.steps.map((step) => (
                    <div key={step.id || step.stepNumber} className="flex gap-3 text-sm">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-blue-700 text-xs font-bold">{step.stepNumber}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-700">
                            Day {seq.steps.slice(0, seq.steps.indexOf(step)).reduce((a, s) => a + s.delayDays, 0) + step.delayDays}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${step.channel === "WhatsApp" ? "bg-green-100 text-green-700" : step.channel === "Email" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                            {step.channel}
                          </span>
                          {step.subject && (
                            <span className="text-xs text-slate-500">Subject: {step.subject}</span>
                          )}
                        </div>
                        <p className="text-slate-600 mt-0.5 text-xs">{step.body.slice(0, 100)}{step.body.length > 100 ? "..." : ""}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Enroll Modal */}
      {enrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 text-lg">Enroll Leads</h2>
              <button onClick={() => setEnrollModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-3">Select leads to enroll in this sequence</p>
            <div className="flex-1 overflow-y-auto space-y-1 mb-4">
              {leads.map((lead) => (
                <label key={lead.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedLeadIds.includes(lead.id)}
                    onChange={(e) => {
                      setSelectedLeadIds((prev) =>
                        e.target.checked ? [...prev, lead.id] : prev.filter((id) => id !== lead.id)
                      );
                    }}
                    className="rounded"
                  />
                  <span className="text-sm text-slate-900">{lead.name}</span>
                  <span className="text-xs text-slate-400 ml-auto">{lead.status}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={enrollLeads}
                disabled={enrolling || selectedLeadIds.length === 0}
                className="btn-primary flex-1"
              >
                {enrolling ? "Enrolling..." : `Enroll ${selectedLeadIds.length} lead${selectedLeadIds.length !== 1 ? "s" : ""}`}
              </button>
              <button onClick={() => setEnrollModal(null)} className="btn-secondary px-4">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
