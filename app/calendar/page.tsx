"use client";

import { useEffect, useState, useCallback } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, addMonths, subMonths, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, X, MapPin, Clock } from "lucide-react";
import Link from "next/link";

type Appointment = {
  id: string;
  title: string;
  date: string;
  duration: number;
  location: string | null;
  notes: string | null;
  status: string;
  lead: { id: string; name: string } | null;
  agent: { id: string; name: string } | null;
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    date: "",
    duration: "60",
    location: "",
    notes: "",
    leadId: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const month = format(currentDate, "yyyy-MM");
      const res = await fetch(`/api/appointments?month=${month}`);
      const data = await res.json();
      setAppointments(data);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad start with empty days
  const startPad = monthStart.getDay(); // 0=Sun
  const calendarCells = [...Array(startPad).fill(null), ...days];

  const getAppointmentsForDay = (day: Date) =>
    appointments.filter((a) => isSameDay(parseISO(a.date), day));

  const selectedDayAppointments = selectedDay ? getAppointmentsForDay(selectedDay) : [];

  const createAppointment = async () => {
    if (!form.title.trim() || !form.date) return;
    setSaving(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const appt = await res.json();
      setAppointments((prev) => [...prev, appt]);
      setShowModal(false);
      setForm({ title: "", date: "", duration: "60", location: "", notes: "", leadId: "" });
    } finally {
      setSaving(false);
    }
  };

  const deleteAppointment = async (id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
    await fetch(`/api/appointments/${id}`, { method: "DELETE" });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
          <p className="text-slate-500 text-sm mt-1">{appointments.length} appointments this month</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Appointment
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 card">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="font-semibold text-slate-900 text-lg">
              {format(currentDate, "MMMM yyyy")}
            </h2>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-slate-500 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-lg overflow-hidden">
            {calendarCells.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} className="bg-white h-16" />;
              const dayAppts = getAppointmentsForDay(day);
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              const isCurrentMonth = isSameMonth(day, currentDate);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(isSameDay(day, selectedDay || new Date(0)) ? null : day)}
                  className={`bg-white h-16 p-1 text-left hover:bg-blue-50 transition-colors ${
                    isSelected ? "bg-blue-50 ring-2 ring-blue-500 ring-inset" : ""
                  }`}
                >
                  <span className={`text-xs font-medium block mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday(day)
                      ? "bg-blue-600 text-white"
                      : isCurrentMonth
                      ? "text-slate-700"
                      : "text-slate-300"
                  }`}>
                    {format(day, "d")}
                  </span>
                  <div className="space-y-0.5">
                    {dayAppts.slice(0, 2).map((a) => (
                      <div
                        key={a.id}
                        className="text-xs bg-blue-100 text-blue-800 rounded px-1 truncate"
                      >
                        {format(parseISO(a.date), "HH:mm")} {a.title}
                      </div>
                    ))}
                    {dayAppts.length > 2 && (
                      <div className="text-xs text-slate-400">+{dayAppts.length - 2} more</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar - selected day or upcoming */}
        <div className="space-y-4">
          {selectedDay ? (
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900">{format(selectedDay, "EEEE, MMM d")}</h3>
                <button onClick={() => setSelectedDay(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {selectedDayAppointments.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">No appointments</p>
              ) : (
                <div className="space-y-2">
                  {selectedDayAppointments.map((appt) => (
                    <AppointmentCard key={appt.id} appt={appt} onDelete={deleteAppointment} />
                  ))}
                </div>
              )}
              <button
                onClick={() => {
                  setForm({ ...form, date: format(selectedDay, "yyyy-MM-dd'T'HH:mm") });
                  setShowModal(true);
                }}
                className="mt-3 w-full text-sm text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add appointment on this day
              </button>
            </div>
          ) : (
            <div className="card">
              <h3 className="font-semibold text-slate-900 mb-3">Upcoming</h3>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-slate-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : appointments.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">No appointments this month</p>
              ) : (
                <div className="space-y-2">
                  {appointments
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .slice(0, 8)
                    .map((appt) => (
                      <AppointmentCard key={appt.id} appt={appt} onDelete={deleteAppointment} />
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Appointment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 text-lg">New Appointment</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Title *"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="input w-full"
                autoFocus
              />
              <input
                type="datetime-local"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="input w-full"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Duration (min)</label>
                  <input
                    type="number"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    className="input w-full"
                    min="15"
                    step="15"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Location</label>
                  <input
                    type="text"
                    placeholder="Location"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="input w-full"
                  />
                </div>
              </div>
              <textarea
                placeholder="Notes (optional)"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="input w-full h-20 resize-none"
              />
              <div className="flex gap-2 pt-2">
                <button onClick={createAppointment} disabled={saving || !form.title || !form.date} className="btn-primary flex-1">
                  {saving ? "Creating..." : "Create Appointment"}
                </button>
                <button onClick={() => setShowModal(false)} className="btn-secondary px-4">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AppointmentCard({ appt, onDelete }: { appt: Appointment; onDelete: (id: string) => void }) {
  return (
    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">{appt.title}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {format(parseISO(appt.date), "MMM d, h:mm a")} · {appt.duration}min
            </span>
            {appt.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {appt.location}
              </span>
            )}
          </div>
          {appt.lead && (
            <Link href={`/leads/${appt.lead.id}`} className="text-xs text-blue-600 hover:underline mt-1 block">
              {appt.lead.name}
            </Link>
          )}
        </div>
        <button
          onClick={() => onDelete(appt.id)}
          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition-all shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
