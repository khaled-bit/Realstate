/**
 * Webhook endpoint for n8n to push leads into this CRM.
 * n8n should POST to: /api/webhooks/leads
 *
 * Payload can be single lead object or array of leads.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface IncomingLead {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  country?: string;
  city?: string;
  source?: string;
  sourceUrl?: string;
  campaign?: string;
  budget?: number | string;
  budgetCurrency?: string;
  propertyType?: string;
  preferredAreas?: string;
  notes?: string;
  apolloId?: string;
  externalId?: string;
  n8nWorkflowId?: string;
}

async function saveLead(raw: IncomingLead) {
  const name = raw.name || `${raw.firstName || ""} ${raw.lastName || ""}`.trim() || "Unknown";

  // Check for duplicate by email or externalId
  if (raw.email || raw.externalId || raw.apolloId) {
    const existing = await prisma.lead.findFirst({
      where: {
        OR: [
          raw.email ? { email: raw.email } : undefined,
          raw.externalId ? { externalId: raw.externalId } : undefined,
          raw.apolloId ? { apolloId: raw.apolloId } : undefined,
        ].filter(Boolean) as Record<string, unknown>[],
      },
    });
    if (existing) {
      // Update existing lead with new info
      return prisma.lead.update({
        where: { id: existing.id },
        data: {
          phone: raw.phone || existing.phone,
          whatsapp: raw.whatsapp || existing.whatsapp,
          notes: raw.notes ? `${existing.notes || ""}\n${raw.notes}`.trim() : existing.notes,
          updatedAt: new Date(),
        },
      });
    }
  }

  const lead = await prisma.lead.create({
    data: {
      name,
      email: raw.email,
      phone: raw.phone,
      whatsapp: raw.whatsapp || raw.phone,
      country: raw.country || "Other",
      city: raw.city,
      source: raw.source || "n8n",
      sourceUrl: raw.sourceUrl,
      campaign: raw.campaign,
      status: "New",
      budget: raw.budget ? parseFloat(String(raw.budget)) : null,
      budgetCurrency: raw.budgetCurrency || "USD",
      propertyType: raw.propertyType,
      preferredAreas: raw.preferredAreas,
      notes: raw.notes,
      apolloId: raw.apolloId,
      externalId: raw.externalId,
      n8nWorkflowId: raw.n8nWorkflowId,
    },
  });

  await prisma.activity.create({
    data: {
      leadId: lead.id,
      type: "Note",
      content: `Lead received from n8n (${raw.source || "webhook"})`,
      by: "n8n",
    },
  });

  return lead;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const leads = Array.isArray(body) ? body : [body];

  const results = await Promise.all(leads.map(saveLead));

  // Fire auto-welcome WhatsApp for truly new leads (non-blocking)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  for (const lead of results) {
    if (lead && (lead.whatsapp || lead.phone)) {
      fetch(`${appUrl}/api/comms/auto-welcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id }),
      }).catch(() => {});
    }
  }

  return NextResponse.json({
    received: leads.length,
    saved: results.length,
    ids: results.map((l) => l.id),
  });
}
