"use client";

import { useEffect, useState, useCallback } from "react";
import { format, isToday, isPast, parseISO } from "date-fns";
import { CheckSquare, Square, Plus, Trash2, Calendar, Flag } from "lucide-react";
import Link from "next/link";

type Task = {
  id: string;
  title: string;
  notes: string | null;
  dueDate: string | null;
  completed: boolean;
  priority: string;
  createdAt: string;
  lead: { id: string; name: string } | null;
  assignedTo: { id: string; name: string; email: string } | null;
};

const PRIORITY_COLORS: Record<string, string> = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-yellow-100 text-yellow-700",
  Low: "bg-green-100 text-green-700",
};

const FILTERS = ["All", "Today", "Overdue", "Pending", "Completed"] as const;
type Filter = typeof FILTERS[number];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    notes: "",
    dueDate: "",
    priority: "Medium",
    leadId: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filteredTasks = tasks.filter((task) => {
    if (filter === "Today") {
      return task.dueDate && isToday(parseISO(task.dueDate));
    }
    if (filter === "Overdue") {
      return task.dueDate && isPast(parseISO(task.dueDate)) && !task.completed && !isToday(parseISO(task.dueDate));
    }
    if (filter === "Pending") return !task.completed;
    if (filter === "Completed") return task.completed;
    return true;
  });

  const toggleTask = async (task: Task) => {
    const updated = { ...task, completed: !task.completed };
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !task.completed }),
    });
  };

  const deleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
  };

  const createTask = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const task = await res.json();
      setTasks((prev) => [task, ...prev]);
      setForm({ title: "", notes: "", dueDate: "", priority: "Medium", leadId: "" });
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const getDueDateColor = (task: Task) => {
    if (!task.dueDate || task.completed) return "text-slate-400";
    const date = parseISO(task.dueDate);
    if (isPast(date) && !isToday(date)) return "text-red-600 font-medium";
    if (isToday(date)) return "text-orange-600 font-medium";
    return "text-slate-500";
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
          <p className="text-slate-500 text-sm mt-1">{tasks.filter((t) => !t.completed).length} pending tasks</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 bg-slate-100 rounded-lg p-1 w-fit">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filter === f ? "bg-white text-slate-900 shadow-sm font-medium" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Add Task Form */}
      {showForm && (
        <div className="card mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Task title *"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="input w-full"
                onKeyDown={(e) => e.key === "Enter" && createTask()}
                autoFocus
              />
            </div>
            <input
              type="text"
              placeholder="Notes (optional)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="input"
            />
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="input"
            />
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="input"
            >
              <option value="Low">Low Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="High">High Priority</option>
            </select>
            <div className="flex gap-2">
              <button onClick={createTask} disabled={saving || !form.title.trim()} className="btn-primary flex-1">
                {saving ? "Saving..." : "Create Task"}
              </button>
              <button onClick={() => setShowForm(false)} className="btn-secondary px-4">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task List */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card animate-pulse h-16" />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No tasks found</p>
          <p className="text-sm mt-1">
            {filter === "All" ? "Create your first task above" : `No ${filter.toLowerCase()} tasks`}
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors group ${
                task.completed ? "opacity-60" : ""
              }`}
            >
              <button
                onClick={() => toggleTask(task)}
                className="mt-0.5 shrink-0 text-slate-400 hover:text-blue-600 transition-colors"
              >
                {task.completed ? (
                  <CheckSquare className="w-5 h-5 text-green-500" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${task.completed ? "line-through text-slate-400" : "text-slate-900"}`}>
                  {task.title}
                </p>
                {task.notes && (
                  <p className="text-xs text-slate-500 mt-0.5">{task.notes}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  {task.dueDate && (
                    <span className={`text-xs flex items-center gap-1 ${getDueDateColor(task)}`}>
                      <Calendar className="w-3 h-3" />
                      {format(parseISO(task.dueDate), "MMM d, yyyy")}
                    </span>
                  )}
                  {task.lead && (
                    <Link
                      href={`/leads/${task.lead.id}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {task.lead.name}
                    </Link>
                  )}
                  {task.assignedTo && (
                    <span className="text-xs text-slate-400">{task.assignedTo.name}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.Medium}`}>
                  <Flag className="w-3 h-3" />
                  {task.priority}
                </span>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
