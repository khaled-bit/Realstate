import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, config } = await req.json();

  try {
    switch (type) {
      case "smtp": {
        const nodemailer = (await import("nodemailer")).default;
        const transporter = nodemailer.createTransport({
          host: config.host,
          port: parseInt(config.port) || 587,
          secure: parseInt(config.port) === 465,
          auth: { user: config.user, pass: config.pass },
        });
        await transporter.verify();
        return NextResponse.json({ success: true, message: "✅ SMTP connection verified successfully" });
      }

      case "whatsapp": {
        if (!config.sendWebhook) return NextResponse.json({ success: false, message: "No webhook URL configured" });
        const res = await fetch(config.sendWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ test: true, message: "Test from Leads Egypt CRM", phone: "00000000000" }),
          signal: AbortSignal.timeout(8000),
        });
        return NextResponse.json({
          success: res.ok,
          message: res.ok ? `✅ n8n webhook responded (${res.status})` : `❌ Webhook returned ${res.status}`,
        });
      }

      case "apollo": {
        if (!config.apiKey) return NextResponse.json({ success: false, message: "No API key provided" });
        const res = await fetch("https://api.apollo.io/v1/auth/health", {
          headers: { "X-Api-Key": config.apiKey, "Content-Type": "application/json" },
          signal: AbortSignal.timeout(8000),
        });
        return NextResponse.json({
          success: res.ok,
          message: res.ok ? "✅ Apollo.io API key is valid" : `❌ Apollo returned ${res.status} — check your API key`,
        });
      }

      case "twilio": {
        if (!config.accountSid || !config.authToken) return NextResponse.json({ success: false, message: "Account SID and Auth Token required" });
        const credentials = Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64");
        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}.json`, {
          headers: { Authorization: `Basic ${credentials}` },
          signal: AbortSignal.timeout(8000),
        });
        const data = await res.json();
        return NextResponse.json({
          success: res.ok,
          message: res.ok ? `✅ Twilio connected — Account: ${data.friendly_name}` : `❌ Twilio error: ${data.message || res.status}`,
        });
      }

      case "stripe": {
        if (!config.secretKey) return NextResponse.json({ success: false, message: "Secret key required" });
        const res = await fetch("https://api.stripe.com/v1/account", {
          headers: { Authorization: `Bearer ${config.secretKey}` },
          signal: AbortSignal.timeout(8000),
        });
        const data = await res.json();
        return NextResponse.json({
          success: res.ok,
          message: res.ok ? `✅ Stripe connected — ${data.email || data.id}` : `❌ Stripe error: ${data.error?.message || res.status}`,
        });
      }

      case "n8n": {
        if (!config.baseUrl) return NextResponse.json({ success: false, message: "n8n URL required" });
        const url = config.baseUrl.replace(/\/$/, "");
        const res = await fetch(`${url}/healthz`, { signal: AbortSignal.timeout(6000) }).catch(() => null);
        if (!res) return NextResponse.json({ success: false, message: "❌ Could not reach n8n — is it running?" });
        return NextResponse.json({
          success: res.ok,
          message: res.ok ? `✅ n8n is reachable at ${url}` : `❌ n8n returned ${res.status}`,
        });
      }

      default:
        return NextResponse.json({ success: false, message: "Unknown integration type" });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, message: `❌ ${msg}` });
  }
}
