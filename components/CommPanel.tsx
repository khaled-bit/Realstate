"use client";

import { useState, useEffect } from "react";
import {
  MessageCircle, Phone, Send, ChevronDown, Clock,
  CheckCheck, AlertCircle, Loader2
} from "lucide-react";

interface Message {
  id: string;
  channel: string;
  direction: string;
  content: string;
  status: string;
  createdAt: string;
}

interface Template {
  id: string;
  name: string;
  language: string;
  body: string;
}

interface CommPanelProps {
  leadId: string;
  leadName: string;
  phone?: string;
  whatsapp?: string;
}

const QUICK_TEMPLATES = [
  {
    name: "welcome_ar",
    label: "Welcome (Arabic)",
    body: `مرحباً {{name}}،
أهلاً بك! نشكرك على اهتمامك بعقاراتنا في مصر 🏡

نحن متخصصون في الوحدات السكنية الفاخرة للمغتربين المصريين وعملاء الخليج.

هل يمكنني مساعدتك في العثور على وحدتك المثالية؟
`,
  },
  {
    name: "welcome_en",
    label: "Welcome (English)",
    body: `Hello {{name}},

Thank you for your interest in Egyptian real estate! 🏡

We specialize in premium properties in New Cairo, Sheikh Zayed & the North Coast — perfect for Gulf-based Egyptians and expats.

What type of property are you looking for?`,
  },
  {
    name: "follow_up",
    label: "Follow-up",
    body: `مرحباً {{name}}،
أردت التواصل معك لمعرفة إذا كان لديك أي أسئلة حول الوحدات العقارية التي ناقشناها.

Hello {{name}}, just following up to see if you have any questions about the properties we discussed. I'm here to help! 🏠`,
  },
  {
    name: "property_share",
    label: "Share Property",
    body: `مرحباً {{name}}،
وجدت وحدة تناسب متطلباتك تماماً!

Hello {{name}}, I found a property that perfectly matches your requirements!

📍 Location: [Area]
🛏 Bedrooms: [X]
💰 Price: [Price] USD

Would you like more details or to schedule a viewing?`,
  },
  {
    name: "appointment",
    label: "Schedule Viewing",
    body: `مرحباً {{name}}،
نود دعوتك لجولة في الوحدة.

Hello {{name}}, we'd love to invite you for a property tour!

📅 Available dates: [Date 1] / [Date 2]
📍 Location: [Address]

Please confirm your preferred date.`,
  },
];

export default function CommPanel({ leadId, leadName, phone, whatsapp }: CommPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [text, setText] = useState("");
  const [channel, setChannel] = useState<"WhatsApp" | "SMS">("WhatsApp");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(true);

  const contactPhone = channel === "WhatsApp" ? (whatsapp || phone) : phone;

  const loadMessages = async () => {
    const res = await fetch(`/api/comms/messages?leadId=${leadId}`);
    const data = await res.json();
    setMessages(data);
    setLoadingMsgs(false);
  };

  useEffect(() => {
    loadMessages();
    fetch("/api/templates").then((r) => r.json()).then(setTemplates);
  }, [leadId]);

  const useTemplate = (tpl: { body: string }) => {
    setText(tpl.body.replace(/{{name}}/g, leadName));
    setShowTemplates(false);
  };

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    setSendResult(null);
    const res = await fetch("/api/comms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, channel, message: text }),
    });
    const data = await res.json();
    if (res.ok) {
      setText("");
      await loadMessages();
      setSendResult(
        data.n8nConnected
          ? data.n8nSuccess
            ? "✅ Sent via WhatsApp"
            : "⚠️ Saved but n8n didn't respond"
          : "📝 Logged (connect n8n 'whatsapp-send' workflow to send real messages)"
      );
    } else {
      setSendResult(`❌ ${data.error}`);
    }
    setSending(false);
    setTimeout(() => setSendResult(null), 6000);
  };

  const statusIcon = (status: string) => {
    if (status === "Sent") return <CheckCheck className="w-3 h-3 text-slate-400" />;
    if (status === "Failed") return <AlertCircle className="w-3 h-3 text-red-400" />;
    if (status === "Pending") return <Clock className="w-3 h-3 text-yellow-400" />;
    return <CheckCheck className="w-3 h-3 text-blue-400" />;
  };

  return (
    <div className="card flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-green-600" />
          Communication
        </h2>
        <div className="flex items-center gap-2">
          {/* Channel toggle */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs">
            <button
              onClick={() => setChannel("WhatsApp")}
              className={`px-2.5 py-1.5 flex items-center gap-1 transition-colors ${
                channel === "WhatsApp" ? "bg-green-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <MessageCircle className="w-3 h-3" /> WA
            </button>
            <button
              onClick={() => setChannel("SMS")}
              className={`px-2.5 py-1.5 flex items-center gap-1 transition-colors ${
                channel === "SMS" ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              SMS
            </button>
          </div>
          {/* Call button */}
          {phone && (
            <a
              href={`tel:${phone}`}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-green-50 hover:text-green-700 hover:border-green-300 transition-colors"
              title={`Call ${phone}`}
            >
              <Phone className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Contact info */}
      {contactPhone && (
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs text-slate-500 flex items-center gap-4">
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-green-700 font-medium hover:underline"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              {whatsapp}
            </a>
          )}
          {phone && (
            <a href={`tel:${phone}`} className="flex items-center gap-1 hover:underline">
              <Phone className="w-3.5 h-3.5" />
              {phone}
            </a>
          )}
        </div>
      )}

      {/* Message feed */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px] max-h-80">
        {loadingMsgs ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No messages yet</p>
            <p className="text-xs mt-1">Use a template below to get started</p>
          </div>
        ) : (
          [...messages].reverse().map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.direction === "Outbound" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  msg.direction === "Outbound"
                    ? "bg-green-600 text-white rounded-br-sm"
                    : "bg-slate-100 text-slate-900 rounded-bl-sm"
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                <div className={`flex items-center justify-end gap-1 mt-1 ${
                  msg.direction === "Outbound" ? "text-green-200" : "text-slate-400"
                }`}>
                  <span className="text-xs">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {msg.direction === "Outbound" && statusIcon(msg.status)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Templates */}
      <div className="px-4 py-2 border-t border-slate-100">
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="text-xs text-blue-600 flex items-center gap-1 hover:underline"
        >
          <ChevronDown className={`w-3 h-3 transition-transform ${showTemplates ? "rotate-180" : ""}`} />
          Message Templates
        </button>
        {showTemplates && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[...QUICK_TEMPLATES, ...templates.map((t) => ({ name: t.name, label: t.name, body: t.body }))].map((tpl) => (
              <button
                key={tpl.name}
                onClick={() => useTemplate(tpl)}
                className="text-xs px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200 hover:bg-blue-100 transition-colors"
              >
                {tpl.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-slate-100">
        {sendResult && (
          <p className="text-xs mb-2 text-slate-600">{sendResult}</p>
        )}
        <div className="flex gap-2">
          <textarea
            className="input flex-1 resize-none text-sm"
            rows={3}
            placeholder={`Type a ${channel} message…`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSend();
            }}
          />
          <button
            onClick={handleSend}
            disabled={sending || !text.trim()}
            className={`px-3 rounded-lg flex items-center gap-1.5 text-sm font-medium transition-colors ${
              channel === "WhatsApp"
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            } disabled:opacity-50`}
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1">Ctrl+Enter to send · Requires n8n 'whatsapp-send' workflow</p>
      </div>
    </div>
  );
}
