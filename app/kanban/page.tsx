"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";

const STATUSES = ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"];

const STATUS_COLORS: Record<string, string> = {
  New: "bg-blue-50 border-blue-200",
  Contacted: "bg-yellow-50 border-yellow-200",
  Qualified: "bg-purple-50 border-purple-200",
  Proposal: "bg-orange-50 border-orange-200",
  Won: "bg-green-50 border-green-200",
  Lost: "bg-red-50 border-red-200",
};

const STATUS_HEADER: Record<string, string> = {
  New: "bg-blue-100 text-blue-800",
  Contacted: "bg-yellow-100 text-yellow-800",
  Qualified: "bg-purple-100 text-purple-800",
  Proposal: "bg-orange-100 text-orange-800",
  Won: "bg-green-100 text-green-800",
  Lost: "bg-red-100 text-red-800",
};

const COUNTRY_FLAGS: Record<string, string> = {
  UAE: "🇦🇪", KSA: "🇸🇦", Kuwait: "🇰🇼", Qatar: "🇶🇦",
  Bahrain: "🇧🇭", Oman: "🇴🇲", Egypt: "🇪🇬", UK: "🇬🇧",
  USA: "🇺🇸", Canada: "🇨🇦",
};

type Lead = {
  id: string;
  name: string;
  country: string;
  budget: number | null;
  budgetCurrency: string;
  status: string;
  source: string;
  assignedTo: { id: string; name: string } | null;
  _count: { activities: number };
};

function LeadCard({ lead, isDragging }: { lead: Lead; isDragging?: boolean }) {
  const flag = COUNTRY_FLAGS[lead.country] || "🌍";
  const initials = lead.assignedTo?.name
    ? lead.assignedTo.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : null;

  return (
    <div
      className={`bg-white rounded-lg border border-slate-200 p-3 shadow-sm ${
        isDragging ? "shadow-lg rotate-2 opacity-80" : "hover:shadow-md"
      } transition-all cursor-grab active:cursor-grabbing`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link
          href={`/leads/${lead.id}`}
          className="font-medium text-slate-900 text-sm hover:text-blue-600 truncate"
          onClick={(e) => e.stopPropagation()}
        >
          {lead.name}
        </Link>
        {initials && (
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span>{flag} {lead.country}</span>
        {lead.budget && (
          <>
            <span>•</span>
            <span className="font-medium text-slate-700">
              {lead.budgetCurrency} {lead.budget.toLocaleString()}
            </span>
          </>
        )}
      </div>
      {lead._count.activities > 0 && (
        <div className="mt-2 text-xs text-slate-400">
          {lead._count.activities} activities
        </div>
      )}
    </div>
  );
}

function SortableCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    data: { type: "lead", lead },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LeadCard lead={lead} />
    </div>
  );
}

function Column({
  status,
  leads,
}: {
  status: string;
  leads: Lead[];
}) {
  return (
    <div className={`rounded-xl border-2 ${STATUS_COLORS[status]} flex flex-col min-h-[200px] w-72 shrink-0`}>
      <div className={`px-3 py-2 rounded-t-lg flex items-center justify-between ${STATUS_HEADER[status]}`}>
        <span className="font-semibold text-sm">{status}</span>
        <span className="text-xs font-medium bg-white/60 rounded-full px-2 py-0.5">{leads.length}</span>
      </div>
      <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
        <div className="p-2 flex flex-col gap-2 flex-1 min-h-[100px]">
          {leads.map((lead) => (
            <SortableCard key={lead.id} lead={lead} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export default function KanbanPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leads?limit=500");
      const data = await res.json();
      setLeads(data.leads || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const leadsByStatus = STATUSES.reduce<Record<string, Lead[]>>((acc, status) => {
    acc[status] = leads.filter((l) => l.status === status);
    return acc;
  }, {});

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
    setActiveId(id);
    setActiveLead(leads.find((l) => l.id === id) || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over || !activeId) return;

    // Check if dropping over a column (status label)
    const overId = over.id as string;
    if (STATUSES.includes(overId)) {
      setLeads((prev) =>
        prev.map((l) => (l.id === activeId ? { ...l, status: overId } : l))
      );
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveLead(null);

    if (!over) return;

    const leadId = active.id as string;
    const overId = over.id as string;

    // Determine target status
    let targetStatus: string | null = null;

    if (STATUSES.includes(overId)) {
      targetStatus = overId;
    } else {
      // Dropped over another lead - find that lead's status
      const overLead = leads.find((l) => l.id === overId);
      if (overLead) targetStatus = overLead.status;
    }

    if (!targetStatus) return;

    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === targetStatus) return;

    // Optimistic update
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: targetStatus! } : l))
    );

    try {
      await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });
    } catch {
      // Revert on error
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: lead.status } : l))
      );
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-8 bg-slate-200 rounded w-48 mb-6 animate-pulse" />
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUSES.map((s) => (
            <div key={s} className="w-72 shrink-0">
              <div className="h-10 bg-slate-200 rounded-t-xl animate-pulse" />
              <div className="h-64 bg-slate-100 rounded-b-xl animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kanban Board</h1>
          <p className="text-slate-500 text-sm mt-1">Drag and drop leads between stages</p>
        </div>
        <Link href="/leads/new" className="btn-primary text-sm px-4 py-2">
          + New Lead
        </Link>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUSES.map((status) => (
            <Column key={status} status={status} leads={leadsByStatus[status]} />
          ))}
        </div>

        <DragOverlay>
          {activeLead && <LeadCard lead={activeLead} isDragging />}
        </DragOverlay>
      </DndContext>

      {leads.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-lg font-medium">No leads yet</p>
          <p className="text-sm mt-1">Add your first lead to get started</p>
        </div>
      )}
    </div>
  );
}
