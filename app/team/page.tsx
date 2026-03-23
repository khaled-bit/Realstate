"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Users, Mail, Shield, UserPlus, Trash2, Copy, Check } from "lucide-react";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  image: string | null;
  createdAt: string;
  _count: { assignedLeads: number };
};

type Invite = {
  id: string;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
  createdAt: string;
};

const ROLE_COLORS: Record<string, string> = {
  Owner: "bg-purple-100 text-purple-800",
  Admin: "bg-blue-100 text-blue-800",
  Agent: "bg-green-100 text-green-700",
  Viewer: "bg-slate-100 text-slate-600",
};

export default function TeamPage() {
  const { data: session } = useSession();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "Agent" });
  const [inviting, setSending] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchTeam = useCallback(async () => {
    setLoading(true);
    try {
      const [membersRes, invitesRes] = await Promise.all([
        fetch("/api/team"),
        fetch("/api/team/invite"),
      ]);
      const [membersData, invitesData] = await Promise.all([
        membersRes.json(),
        invitesRes.json(),
      ]);
      setMembers(membersData);
      setInvites(invitesData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const sendInvite = async () => {
    if (!inviteForm.email.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteForm),
      });
      const data = await res.json();
      if (data.invite) {
        setInvites((prev) => [data.invite, ...prev]);
        setInviteLink(data.inviteUrl);
        setInviteForm({ email: "", role: "Agent" });
      } else {
        alert(data.error || "Failed to create invite");
      }
    } finally {
      setSending(false);
    }
  };

  const changeRole = async (userId: string, role: string) => {
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    if (res.ok) {
      setMembers((prev) => prev.map((m) => (m.id === userId ? { ...m, role } : m)));
    }
  };

  const copyInviteLink = async (link: string) => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const removeMember = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from the workspace?`)) return;
    const res = await fetch("/api/team", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m.id !== userId));
    } else {
      const data = await res.json();
      alert(data.error || "Failed to remove member");
    }
  };

  const cancelInvite = async (inviteId: string) => {
    const res = await fetch("/api/team/invite", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteId }),
    });
    if (res.ok) {
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
    }
  };

  const canManage = ["Owner", "Admin"].includes(session?.user?.role || "");

  const initials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team</h1>
          <p className="text-slate-500 text-sm mt-1">{members.length} team members</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Members list */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Members</h2>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card animate-pulse h-20" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="card text-center py-12 text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No team members yet</p>
            </div>
          ) : (
            members.map((member) => (
              <div key={member.id} className="card flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-white text-sm font-bold">{initials(member.name)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-slate-900">{member.name}</p>
                    {member.id === session?.user?.id && (
                      <span className="text-xs text-slate-400">(you)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {member.email}
                    </span>
                    <span>{member._count.assignedLeads} leads</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {canManage && member.role !== "Owner" && member.id !== session?.user?.id ? (
                    <>
                      <select
                        value={member.role}
                        onChange={(e) => changeRole(member.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full border-0 font-medium cursor-pointer ${ROLE_COLORS[member.role] || ROLE_COLORS.Agent}`}
                      >
                        <option value="Admin">Admin</option>
                        <option value="Agent">Agent</option>
                        <option value="Viewer">Viewer</option>
                      </select>
                      <button
                        onClick={() => removeMember(member.id, member.name)}
                        className="text-slate-300 hover:text-red-600 transition-colors"
                        title="Remove from workspace"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 ${ROLE_COLORS[member.role] || ROLE_COLORS.Agent}`}>
                      <Shield className="w-3 h-3" />
                      {member.role}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Invite panel */}
        <div className="space-y-4">
          {canManage && (
            <div className="card">
              <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Invite Member
              </h2>
              <div className="space-y-2">
                <input
                  type="email"
                  placeholder="Email address"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="input w-full"
                />
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  className="input w-full"
                >
                  <option value="Admin">Admin</option>
                  <option value="Agent">Agent</option>
                  <option value="Viewer">Viewer</option>
                </select>
                <button
                  onClick={sendInvite}
                  disabled={inviting || !inviteForm.email.trim()}
                  className="btn-primary w-full"
                >
                  {inviting ? "Sending..." : "Send Invite"}
                </button>
              </div>

              {inviteLink && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs font-medium text-green-700 mb-1">Invite link created!</p>
                  <div className="flex gap-2">
                    <p className="text-xs text-green-600 flex-1 truncate">{inviteLink}</p>
                    <button
                      onClick={() => copyInviteLink(inviteLink)}
                      className="text-green-600 hover:text-green-800"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pending invites */}
          {invites.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-slate-900 mb-3">Pending Invites</h2>
              <div className="space-y-2">
                {invites.map((invite) => (
                  <div key={invite.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{invite.email}</p>
                      <p className="text-xs text-slate-500">{invite.role}</p>
                    </div>
                    <button
                      onClick={() => copyInviteLink(`${window.location.origin}/register?token=${invite.token}`)}
                      className="text-slate-400 hover:text-blue-600"
                      title="Copy invite link"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => cancelInvite(invite.id)}
                      className="text-slate-300 hover:text-red-600 transition-colors"
                      title="Cancel invite"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
