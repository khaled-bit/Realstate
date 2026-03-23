"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Settings, Mail, MessageCircle, Zap, Phone, CreditCard,
  CheckCircle2, XCircle, Loader2, Save, Eye, EyeOff,
  Building2, Globe, Key, AlertCircle, ExternalLink, RefreshCw,
} from "lucide-react";

interface WorkspaceSettings {
  smtp?: { host: string; port: string; user: string; pass: string; from: string };
  whatsapp?: { welcomeWebhook: string; sendWebhook: string; facebookWebhook: string };
  apollo?: { apiKey: string };
  twilio?: { accountSid: string; authToken: string; phoneNumber: string; twimlAppSid: string };
  stripe?: { secretKey: string; publishableKey: string; webhookSecret: string; starterPriceId: string; proPriceId: string };
  n8n?: { baseUrl: string };
  google?: { clientId: string; clientSecret: string };
}

type TestStatus = "idle" | "testing" | "ok" | "error";
interface TestResult { status: TestStatus; message: string }

const EMPTY: WorkspaceSettings = {
  smtp: { host: "smtp.gmail.com", port: "587", user: "", pass: "", from: "" },
  whatsapp: { welcomeWebhook: "", sendWebhook: "", facebookWebhook: "" },
  apollo: { apiKey: "" },
  twilio: { accountSid: "", authToken: "", phoneNumber: "", twimlAppSid: "" },
  stripe: { secretKey: "", publishableKey: "", webhookSecret: "", starterPriceId: "", proPriceId: "" },
  n8n: { baseUrl: "http://localhost:5678" },
  google: { clientId: "", clientSecret: "" },
};

function Section({ id, icon: Icon, title, color, badge, children }: {
  id: string; icon: React.ElementType; title: string; color: string; badge?: string; children: React.ReactNode;
}) {
  return (
    <div id={id} className="card overflow-hidden">
      <div className={`px-4 py-3 border-b border-slate-100 flex items-center justify-between ${color}`}>
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" />
          <h2 className="font-semibold text-sm">{title}</h2>
        </div>
        {badge && <span className="text-xs bg-white/60 px-2 py-0.5 rounded-full font-medium">{badge}</span>}
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

function SecretInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        className="input pr-9 font-mono text-xs"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "••••••••"}
      />
      <button type="button" onClick={() => setShow(!show)} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

function TestBtn({ status, onClick, label = "Test Connection" }: { status: TestStatus; onClick: () => void; label?: string }) {
  return (
    <button type="button" onClick={onClick} disabled={status === "testing"} className="btn-secondary flex items-center gap-2 text-xs px-3 py-1.5">
      {status === "testing" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {status === "ok" && <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />}
      {status === "error" && <XCircle className="w-3.5 h-3.5 text-red-500" />}
      {status === "idle" && <RefreshCw className="w-3.5 h-3.5" />}
      {status === "testing" ? "Testing..." : label}
    </button>
  );
}

function TestResultBadge({ result }: { result: TestResult }) {
  if (result.status === "idle") return null;
  if (result.status === "testing") return null;
  const ok = result.status === "ok";
  return (
    <div className={`flex items-start gap-2 text-xs rounded-lg px-3 py-2 mt-2 ${ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
      {ok ? <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
      {result.message}
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<WorkspaceSettings>(EMPTY);
  const [workspaceName, setWorkspaceName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tests, setTests] = useState<Record<string, TestResult>>({});

  const set = useCallback(<K extends keyof WorkspaceSettings>(section: K, field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [section]: { ...(prev[section] as Record<string, string>), [field]: value },
    }));
  }, []);

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(data => {
      setWorkspaceName(data.name || "");
      if (data.settings) {
        setSettings(s => ({ ...s, ...(data.settings as WorkspaceSettings) }));
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: workspaceName, settings }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const runTest = async (type: string, config: Record<string, string>) => {
    setTests(t => ({ ...t, [type]: { status: "testing", message: "" } }));
    const res = await fetch("/api/settings/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, config }),
    });
    const data = await res.json();
    setTests(t => ({ ...t, [type]: { status: data.success ? "ok" : "error", message: data.message } }));
  };

  const t = (key: string): TestResult => tests[key] || { status: "idle", message: "" };

  if (loading) return (
    <div className="p-6 flex items-center gap-3 text-slate-500">
      <Loader2 className="w-5 h-5 animate-spin" /> Loading settings...
    </div>
  );

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600" /> Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">Configure integrations for your workspace. All settings are saved per workspace.</p>
      </div>

      {/* Jump links */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: "workspace", label: "Workspace" },
          { id: "smtp", label: "Email / SMTP" },
          { id: "whatsapp", label: "WhatsApp" },
          { id: "n8n", label: "n8n" },
          { id: "apollo", label: "Apollo.io" },
          { id: "twilio", label: "Twilio" },
          { id: "stripe", label: "Stripe" },
          { id: "google", label: "Google OAuth" },
        ].map(s => (
          <a key={s.id} href={`#${s.id}`} className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-full hover:border-blue-400 hover:text-blue-700 transition-colors">
            {s.label}
          </a>
        ))}
      </div>

      <div className="space-y-4">

        {/* ── Workspace ─────────────────────────────────── */}
        <Section id="workspace" icon={Building2} title="Workspace" color="bg-slate-50 text-slate-700">
          <Field label="Workspace / Brokerage Name">
            <input className="input" value={workspaceName} onChange={e => setWorkspaceName(e.target.value)} placeholder="Cairo Realty Group" />
          </Field>
        </Section>

        {/* ── Email / SMTP ──────────────────────────────── */}
        <Section id="smtp" icon={Mail} title="Email / SMTP" color="bg-blue-50 text-blue-800" badge="Outbound email">
          <p className="text-xs text-slate-500">Used for sending emails from the CRM. Works with Gmail, Outlook, or any SMTP provider.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="SMTP Host">
              <input className="input font-mono text-xs" value={settings.smtp?.host || ""} onChange={e => set("smtp", "host", e.target.value)} placeholder="smtp.gmail.com" />
            </Field>
            <Field label="Port">
              <input className="input font-mono text-xs" value={settings.smtp?.port || ""} onChange={e => set("smtp", "port", e.target.value)} placeholder="587" />
            </Field>
            <Field label="Username / Email">
              <input className="input text-xs" value={settings.smtp?.user || ""} onChange={e => set("smtp", "user", e.target.value)} placeholder="you@gmail.com" />
            </Field>
            <Field label="Password / App Password" hint="Gmail: use an App Password, not your login password">
              <SecretInput value={settings.smtp?.pass || ""} onChange={v => set("smtp", "pass", v)} />
            </Field>
            <Field label="From Name & Email" hint='e.g. "Cairo Realty <you@gmail.com>"' >
              <input className="input text-xs sm:col-span-2" value={settings.smtp?.from || ""} onChange={e => set("smtp", "from", e.target.value)} placeholder="Leads Egypt <you@gmail.com>" />
            </Field>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <TestBtn status={t("smtp").status} onClick={() => runTest("smtp", settings.smtp as Record<string, string>)} label="Send Test Email" />
            <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              Get Gmail App Password <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <TestResultBadge result={t("smtp")} />
        </Section>

        {/* ── WhatsApp ──────────────────────────────────── */}
        <Section id="whatsapp" icon={MessageCircle} title="WhatsApp via n8n" color="bg-green-50 text-green-800" badge="Messaging">
          <p className="text-xs text-slate-500">Paste the webhook URLs from your imported n8n workflows. These trigger WhatsApp sends.</p>

          <Field label="Welcome Webhook (auto-sent on new lead)" hint="From the 'whatsapp-welcome' n8n workflow → Webhook node → copy URL">
            <input className="input font-mono text-xs" value={settings.whatsapp?.welcomeWebhook || ""} onChange={e => set("whatsapp", "welcomeWebhook", e.target.value)} placeholder="http://localhost:5678/webhook/whatsapp-welcome" />
          </Field>
          <Field label="Send Webhook (manual send from lead page)" hint="From the 'whatsapp-send' n8n workflow → Webhook node → copy URL">
            <input className="input font-mono text-xs" value={settings.whatsapp?.sendWebhook || ""} onChange={e => set("whatsapp", "sendWebhook", e.target.value)} placeholder="http://localhost:5678/webhook/whatsapp-send" />
          </Field>
          <Field label="Facebook Leads Webhook" hint="From the 'facebook-leads-to-crm' n8n workflow → Webhook node → copy URL">
            <input className="input font-mono text-xs" value={settings.whatsapp?.facebookWebhook || ""} onChange={e => set("whatsapp", "facebookWebhook", e.target.value)} placeholder="http://localhost:5678/webhook/facebook-leads" />
          </Field>

          <div className="flex items-center gap-3 pt-1">
            <TestBtn status={t("whatsapp").status} onClick={() => runTest("whatsapp", { sendWebhook: settings.whatsapp?.sendWebhook || "" })} label="Ping Send Webhook" />
            <a href="/n8n" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              Manage n8n workflows →
            </a>
          </div>
          <TestResultBadge result={t("whatsapp")} />
        </Section>

        {/* ── n8n ───────────────────────────────────────── */}
        <Section id="n8n" icon={Zap} title="n8n Automation" color="bg-orange-50 text-orange-800" badge="Automation">
          <p className="text-xs text-slate-500">Your n8n instance URL. Used to verify connectivity and trigger workflows.</p>
          <Field label="n8n Base URL" hint="e.g. http://localhost:5678 or https://your-n8n.railway.app">
            <input className="input font-mono text-xs" value={settings.n8n?.baseUrl || ""} onChange={e => set("n8n", "baseUrl", e.target.value)} placeholder="http://localhost:5678" />
          </Field>
          <div className="flex items-center gap-3">
            <TestBtn status={t("n8n").status} onClick={() => runTest("n8n", { baseUrl: settings.n8n?.baseUrl || "" })} />
          </div>
          <TestResultBadge result={t("n8n")} />
        </Section>

        {/* ── Apollo.io ─────────────────────────────────── */}
        <Section id="apollo" icon={Globe} title="Apollo.io" color="bg-purple-50 text-purple-800" badge="Lead enrichment">
          <p className="text-xs text-slate-500">Used by n8n workflows to scrape and enrich leads (Egyptian expats in Gulf countries).</p>
          <Field label="Apollo.io API Key">
            <SecretInput value={settings.apollo?.apiKey || ""} onChange={v => set("apollo", "apiKey", v)} placeholder="your-apollo-api-key" />
          </Field>
          <div className="flex items-center gap-3">
            <TestBtn status={t("apollo").status} onClick={() => runTest("apollo", { apiKey: settings.apollo?.apiKey || "" })} label="Verify API Key" />
            <a href="https://developer.apollo.io/" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              Apollo Developer Docs <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <TestResultBadge result={t("apollo")} />
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
            <strong>n8n field mapping:</strong><br />
            name → person.name · email → person.email · phone → person.phone_numbers[0] · country → person.present_raw_address · apolloId → person.id
          </div>
        </Section>

        {/* ── Twilio ────────────────────────────────────── */}
        <Section id="twilio" icon={Phone} title="Twilio" color="bg-red-50 text-red-800" badge="Calling + SMS">
          <p className="text-xs text-slate-500">Enables VoIP browser calling and SMS. Get credentials from <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">console.twilio.com</a>.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Account SID">
              <input className="input font-mono text-xs" value={settings.twilio?.accountSid || ""} onChange={e => set("twilio", "accountSid", e.target.value)} placeholder="ACxxxxxxxxxxxxxxxx" />
            </Field>
            <Field label="Auth Token">
              <SecretInput value={settings.twilio?.authToken || ""} onChange={v => set("twilio", "authToken", v)} placeholder="your-auth-token" />
            </Field>
            <Field label="Twilio Phone Number" hint="Format: +1234567890">
              <input className="input font-mono text-xs" value={settings.twilio?.phoneNumber || ""} onChange={e => set("twilio", "phoneNumber", e.target.value)} placeholder="+12025551234" />
            </Field>
            <Field label="TwiML App SID" hint="For browser calling. Create at console.twilio.com/voice/twiml/apps">
              <input className="input font-mono text-xs" value={settings.twilio?.twimlAppSid || ""} onChange={e => set("twilio", "twimlAppSid", e.target.value)} placeholder="APxxxxxxxxxxxxxxxx" />
            </Field>
          </div>
          <div className="flex items-center gap-3">
            <TestBtn status={t("twilio").status} onClick={() => runTest("twilio", { accountSid: settings.twilio?.accountSid || "", authToken: settings.twilio?.authToken || "" })} label="Verify Credentials" />
          </div>
          <TestResultBadge result={t("twilio")} />
        </Section>

        {/* ── Stripe ────────────────────────────────────── */}
        <Section id="stripe" icon={CreditCard} title="Stripe" color="bg-indigo-50 text-indigo-800" badge="Billing">
          <p className="text-xs text-slate-500">
            Enables subscription billing for your SaaS customers. Get keys from{" "}
            <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">dashboard.stripe.com</a>.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Secret Key">
              <SecretInput value={settings.stripe?.secretKey || ""} onChange={v => set("stripe", "secretKey", v)} placeholder="sk_live_..." />
            </Field>
            <Field label="Publishable Key">
              <input className="input font-mono text-xs" value={settings.stripe?.publishableKey || ""} onChange={e => set("stripe", "publishableKey", e.target.value)} placeholder="pk_live_..." />
            </Field>
            <Field label="Webhook Secret" hint="From Stripe Dashboard → Webhooks → your endpoint">
              <SecretInput value={settings.stripe?.webhookSecret || ""} onChange={v => set("stripe", "webhookSecret", v)} placeholder="whsec_..." />
            </Field>
            <Field label="Starter Plan Price ID" hint="$29/mo plan price ID">
              <input className="input font-mono text-xs" value={settings.stripe?.starterPriceId || ""} onChange={e => set("stripe", "starterPriceId", e.target.value)} placeholder="price_..." />
            </Field>
            <Field label="Pro Plan Price ID" hint="$79/mo plan price ID">
              <input className="input font-mono text-xs" value={settings.stripe?.proPriceId || ""} onChange={e => set("stripe", "proPriceId", e.target.value)} placeholder="price_..." />
            </Field>
          </div>
          <div className="flex items-center gap-3">
            <TestBtn status={t("stripe").status} onClick={() => runTest("stripe", { secretKey: settings.stripe?.secretKey || "" })} label="Verify Stripe Key" />
            <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              Set up webhook <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <TestResultBadge result={t("stripe")} />
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-xs text-indigo-800">
            <strong>Stripe webhook endpoint:</strong><br />
            <code className="font-mono">{typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"}/api/billing/webhook</code>
            <br />Events to send: <code className="font-mono">customer.subscription.updated, customer.subscription.deleted, checkout.session.completed</code>
          </div>
        </Section>

        {/* ── Google OAuth ──────────────────────────────── */}
        <Section id="google" icon={Key} title="Google OAuth" color="bg-yellow-50 text-yellow-800" badge="Sign in with Google">
          <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Google OAuth credentials must be set as <strong>environment variables</strong> on Vercel — they cannot be stored per-workspace. Add them in your Vercel project settings.</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Client ID (env: GOOGLE_CLIENT_ID)" hint="From Google Cloud Console → Credentials">
              <input className="input font-mono text-xs bg-slate-50" value={settings.google?.clientId || ""} onChange={e => set("google", "clientId", e.target.value)} placeholder="xxxx.apps.googleusercontent.com" />
            </Field>
            <Field label="Client Secret (env: GOOGLE_CLIENT_SECRET)">
              <SecretInput value={settings.google?.clientSecret || ""} onChange={v => set("google", "clientSecret", v)} placeholder="GOCSPX-..." />
            </Field>
          </div>
          <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside mt-1">
            <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console → Credentials</a></li>
            <li>Create OAuth 2.0 Client ID (Web application)</li>
            <li>Add authorized redirect: <code className="bg-slate-100 px-1 rounded font-mono">YOUR_DOMAIN/api/auth/callback/google</code></li>
            <li>Add <code className="bg-slate-100 px-1 rounded font-mono">GOOGLE_CLIENT_ID</code> and <code className="bg-slate-100 px-1 rounded font-mono">GOOGLE_CLIENT_SECRET</code> to Vercel env vars</li>
          </ol>
        </Section>

        {/* Save button */}
        <div className="flex items-center gap-3 pb-4">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save All Settings"}
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-green-700">
              <CheckCircle2 className="w-4 h-4" /> Settings saved!
            </span>
          )}
        </div>

      </div>
    </div>
  );
}
