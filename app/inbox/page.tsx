"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { format, parseISO } from "date-fns";
import { Send, MessageSquare, Mail, Phone, Search } from "lucide-react";
import Link from "next/link";

type Message = {
  id: string;
  channel: string;
  direction: string;
  content: string;
  subject: string | null;
  status: string;
  createdAt: string;
  leadId: string;
  lead: {
    id: string;
    name: string;
    country: string;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
  };
};

type Conversation = {
  lead: Message["lead"];
  latestMessage: Message;
  messageCount: number;
  unread: boolean;
};

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  WhatsApp: <Phone className="w-3 h-3" />,
  Email: <Mail className="w-3 h-3" />,
  SMS: <MessageSquare className="w-3 h-3" />,
};

const CHANNEL_COLORS: Record<string, string> = {
  WhatsApp: "bg-green-100 text-green-700",
  Email: "bg-blue-100 text-blue-700",
  SMS: "bg-purple-100 text-purple-700",
};

const CHANNELS = ["All", "WhatsApp", "Email", "SMS"] as const;
type Channel = typeof CHANNELS[number];

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState<Channel>("All");
  const [search, setSearch] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replyChannel, setReplyChannel] = useState<"WhatsApp" | "Email">("WhatsApp");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchInbox = useCallback(async () => {
    setLoading(true);
    try {
      const params = channelFilter !== "All" ? `?channel=${channelFilter}` : "";
      const res = await fetch(`/api/inbox${params}`);
      const data = await res.json();
      setConversations(data.conversations || []);
      setMessages(data.messages || []);
    } finally {
      setLoading(false);
    }
  }, [channelFilter]);

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedLead, messages]);

  const filteredConversations = conversations.filter((c) => {
    if (!search) return true;
    return c.lead.name.toLowerCase().includes(search.toLowerCase());
  });

  const threadMessages = messages
    .filter((m) => m.leadId === selectedLead)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const selectedConv = conversations.find((c) => c.lead.id === selectedLead);

  const sendReply = async () => {
    if (!replyText.trim() || !selectedLead) return;
    setSending(true);
    try {
      const res = await fetch("/api/comms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: selectedLead, channel: replyChannel, message: replyText }),
      });
      const data = await res.json();
      if (data.message) {
        // Add to local messages
        const newMsg = { ...data.message, lead: selectedConv?.lead };
        setMessages((prev) => [...prev, newMsg]);
        setReplyText("");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ height: "calc(100vh - 0px)" }}>
      {/* Left panel - Conversations */}
      <div className="w-80 shrink-0 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h1 className="font-bold text-slate-900 text-lg mb-3">Inbox</h1>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input w-full pl-9"
            />
          </div>
          {/* Channel tabs */}
          <div className="flex gap-1">
            {CHANNELS.map((ch) => (
              <button
                key={ch}
                onClick={() => setChannelFilter(ch)}
                className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${
                  channelFilter === ch
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-full animate-pulse shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 bg-slate-200 rounded animate-pulse" />
                    <div className="h-3 bg-slate-100 rounded animate-pulse w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const initials = conv.lead.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
              return (
                <button
                  key={conv.lead.id}
                  onClick={() => setSelectedLead(conv.lead.id)}
                  className={`w-full p-4 flex gap-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 ${
                    selectedLead === conv.lead.id ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-medium text-slate-900 text-sm truncate">{conv.lead.name}</p>
                      <span className="text-xs text-slate-400 shrink-0">
                        {format(parseISO(conv.latestMessage.createdAt), "MMM d")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1 ${CHANNEL_COLORS[conv.latestMessage.channel] || "bg-slate-100 text-slate-600"}`}>
                        {CHANNEL_ICONS[conv.latestMessage.channel]}
                        {conv.latestMessage.channel}
                      </span>
                      {conv.unread && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{conv.latestMessage.content}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right panel - Thread */}
      <div className="flex-1 flex flex-col bg-slate-50">
        {selectedLead && selectedConv ? (
          <>
            {/* Thread header */}
            <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center gap-4">
              <div>
                <Link href={`/leads/${selectedConv.lead.id}`} className="font-bold text-slate-900 hover:text-blue-600">
                  {selectedConv.lead.name}
                </Link>
                <p className="text-xs text-slate-500">
                  {selectedConv.lead.country}
                  {selectedConv.lead.phone && ` · ${selectedConv.lead.phone}`}
                  {selectedConv.lead.email && ` · ${selectedConv.lead.email}`}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {threadMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.direction === "Outbound" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-sm rounded-2xl px-4 py-2.5 ${
                      msg.direction === "Outbound"
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-white border border-slate-200 text-slate-900 rounded-bl-sm"
                    }`}
                  >
                    {msg.subject && (
                      <p className={`text-xs font-medium mb-1 ${msg.direction === "Outbound" ? "text-blue-200" : "text-slate-500"}`}>
                        {msg.subject}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <div className={`flex items-center gap-2 mt-1 ${msg.direction === "Outbound" ? "justify-end" : "justify-start"}`}>
                      <span className={`text-xs ${msg.direction === "Outbound" ? "text-blue-200" : "text-slate-400"}`}>
                        {format(parseISO(msg.createdAt), "h:mm a")}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        msg.direction === "Outbound" ? "bg-blue-500 text-blue-100" : CHANNEL_COLORS[msg.channel] || "bg-slate-100 text-slate-600"
                      }`}>
                        {msg.channel}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Reply box */}
            <div className="p-4 bg-white border-t border-slate-200">
              <div className="flex gap-2 mb-2">
                {(["WhatsApp", "Email"] as const).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setReplyChannel(ch)}
                    className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 transition-colors ${
                      replyChannel === ch
                        ? CHANNEL_COLORS[ch]
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {CHANNEL_ICONS[ch]}
                    {ch}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Send via ${replyChannel}...`}
                  className="input flex-1 resize-none h-20"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) sendReply();
                  }}
                />
                <button
                  onClick={sendReply}
                  disabled={sending || !replyText.trim()}
                  className="btn-primary px-4 self-end flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">Ctrl+Enter to send</p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm mt-1">Choose a lead from the left to view messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
