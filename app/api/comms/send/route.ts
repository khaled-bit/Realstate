/**
 * Send a WhatsApp/SMS message to a lead via n8n.
 * n8n handles the actual WhatsApp Business API call.
 *
 * POST /api/comms/send
 * { leadId, channel, message, templateName? }
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  const { leadId, channel, message, templateName } = await req.json();

  const lead = await prisma.lead.findUnique({ where: { id: leadId, workspaceId } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const phone = channel === "WhatsApp" ? lead.whatsapp || lead.phone : lead.phone;
  if (!phone) {
    return NextResponse.json({ error: "No phone number on this lead" }, { status: 400 });
  }

  // Find the n8n whatsapp workflow
  const workflowName = channel === "WhatsApp" ? "whatsapp-send" : "sms-send";
  const config = await prisma.n8nConfig.findUnique({ where: { workspaceId_name: { workspaceId, name: workflowName } } });

  let n8nResult: { success: boolean; msgId?: string } = { success: false };

  if (config?.isActive) {
    try {
      const res = await fetch(config.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "leads-egypt-crm",
          leadId: lead.id,
          name: lead.name,
          phone,
          channel,
          message,
          templateName,
        }),
      });
      const data = res.ok ? await res.json().catch(() => ({})) : {};
      n8nResult = { success: res.ok, msgId: data.msgId || data.id };

      await prisma.n8nConfig.update({
        where: { workspaceId_name: { workspaceId, name: workflowName } },
        data: { lastTriggered: new Date() },
      });
    } catch {
      n8nResult = { success: false };
    }
  }

  // Save message record
  const msg = await prisma.message.create({
    data: {
      leadId,
      channel,
      direction: "Outbound",
      content: message,
      status: n8nResult.success ? "Sent" : config ? "Failed" : "Pending",
      n8nMsgId: n8nResult.msgId,
    },
  });

  // Update lead
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      lastContact: new Date(),
      ...(channel === "WhatsApp" && {
        whatsappSent: true,
        whatsappSentAt: new Date(),
        lastWhatsapp: message.slice(0, 100),
      }),
    },
  });

  // Log activity
  await prisma.activity.create({
    data: {
      leadId,
      type: channel,
      content: `${channel} sent: "${message.slice(0, 80)}${message.length > 80 ? "…" : ""}"`,
      by: "User",
    },
  });

  return NextResponse.json({
    message: msg,
    n8nConnected: !!config?.isActive,
    n8nSuccess: n8nResult.success,
    note: !config?.isActive
      ? "Configure the 'whatsapp-send' n8n webhook in the n8n Workflows tab to send real messages."
      : undefined,
  });
}
