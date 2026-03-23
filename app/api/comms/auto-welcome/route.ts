/**
 * Called automatically when a new lead is created.
 * Triggers n8n 'whatsapp-welcome' workflow to send an auto-welcome message.
 * Also used by n8n webhook (leads arrive → auto-welcome fires).
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { leadId } = await req.json();

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const phone = lead.whatsapp || lead.phone;
  if (!phone) return NextResponse.json({ skipped: true, reason: "no_phone" });

  const config = await prisma.n8nConfig.findUnique({ where: { name: "whatsapp-welcome" } });
  if (!config?.isActive) {
    return NextResponse.json({ skipped: true, reason: "workflow_not_configured" });
  }

  // Get the welcome template
  const template = await prisma.messageTemplate.findFirst({
    where: { name: "welcome", isActive: true },
  });

  const message = template?.body
    ? template.body
        .replace("{{name}}", lead.name)
        .replace("{{country}}", lead.country)
    : buildDefaultWelcome(lead.name);

  try {
    const res = await fetch(config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "leads-egypt-crm",
        event: "new_lead",
        leadId: lead.id,
        name: lead.name,
        phone,
        message,
        country: lead.country,
        budget: lead.budget,
        propertyType: lead.propertyType,
      }),
    });

    await prisma.n8nConfig.update({
      where: { name: "whatsapp-welcome" },
      data: { lastTriggered: new Date() },
    });

    if (res.ok) {
      await prisma.lead.update({
        where: { id: leadId },
        data: { whatsappSent: true, whatsappSentAt: new Date(), lastWhatsapp: message.slice(0, 100) },
      });
      await prisma.message.create({
        data: { leadId, channel: "WhatsApp", direction: "Outbound", content: message, status: "Sent" },
      });
      await prisma.activity.create({
        data: { leadId, type: "WhatsApp", content: "Auto-welcome message sent via n8n", by: "System" },
      });
    }

    return NextResponse.json({ sent: res.ok });
  } catch {
    return NextResponse.json({ sent: false, error: "n8n unreachable" });
  }
}

function buildDefaultWelcome(name: string) {
  return `مرحباً ${name}،
أهلاً بك! نشكرك على اهتمامك بعقارات مصر 🏡

نحن متخصصون في توفير أفضل الوحدات السكنية للمغتربين المصريين وعملاء الخليج.

هل يمكنني مساعدتك في العثور على وحدتك المثالية؟

Hello ${name},
Welcome! Thank you for your interest in Egyptian real estate 🏡

We specialize in premium properties for Gulf clients & Egyptian expats.

May I help you find your perfect property?`;
}
