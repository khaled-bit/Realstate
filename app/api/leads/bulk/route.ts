import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  const { action, leadIds, value } = await req.json();

  if (!Array.isArray(leadIds) || leadIds.length === 0) {
    return NextResponse.json({ error: "leadIds required" }, { status: 400 });
  }

  // Verify all leads belong to workspace
  const leads = await prisma.lead.findMany({
    where: { id: { in: leadIds }, workspaceId },
    select: { id: true, whatsapp: true, phone: true, name: true },
  });

  const validIds = leads.map((l) => l.id);

  switch (action) {
    case "status": {
      if (!value) return NextResponse.json({ error: "value required for status action" }, { status: 400 });
      await prisma.lead.updateMany({
        where: { id: { in: validIds } },
        data: { status: value },
      });
      // Log activities
      await prisma.activity.createMany({
        data: validIds.map((id) => ({
          leadId: id,
          type: "StatusChange",
          content: `Bulk status change to ${value}`,
          by: session.user.name || "User",
        })),
      });
      return NextResponse.json({ updated: validIds.length });
    }

    case "assign": {
      if (!value) return NextResponse.json({ error: "value (userId) required for assign action" }, { status: 400 });
      // Verify assignee belongs to workspace
      const assignee = await prisma.user.findUnique({ where: { id: value, workspaceId } });
      if (!assignee) return NextResponse.json({ error: "Assignee not found" }, { status: 404 });
      await prisma.lead.updateMany({
        where: { id: { in: validIds } },
        data: { assignedToId: value },
      });
      return NextResponse.json({ updated: validIds.length });
    }

    case "whatsapp": {
      if (!value) return NextResponse.json({ error: "message required for whatsapp action" }, { status: 400 });
      // Send WhatsApp to all leads via n8n
      const config = await prisma.n8nConfig.findUnique({
        where: { workspaceId_name: { workspaceId, name: "whatsapp-send" } },
      });
      let sent = 0;
      for (const lead of leads) {
        const phone = lead.whatsapp || lead.phone;
        if (!phone) continue;
        if (config?.isActive) {
          await fetch(config.webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              source: "bulk-send",
              leadId: lead.id,
              name: lead.name,
              phone,
              channel: "WhatsApp",
              message: value,
            }),
          }).catch(() => {});
        }
        await prisma.message.create({
          data: {
            leadId: lead.id,
            channel: "WhatsApp",
            direction: "Outbound",
            content: value,
            status: config?.isActive ? "Sent" : "Pending",
          },
        });
        sent++;
      }
      return NextResponse.json({ sent });
    }

    case "sequence": {
      if (!value) return NextResponse.json({ error: "sequenceId required for sequence action" }, { status: 400 });
      const sequence = await prisma.sequence.findUnique({ where: { id: value, workspaceId } });
      if (!sequence) return NextResponse.json({ error: "Sequence not found" }, { status: 404 });
      const now = new Date();
      await Promise.allSettled(
        validIds.map((leadId) =>
          prisma.sequenceEnrollment.upsert({
            where: { sequenceId_leadId: { sequenceId: value, leadId } },
            update: { status: "Active", currentStep: 0, nextRunAt: now },
            create: { sequenceId: value, leadId, currentStep: 0, status: "Active", nextRunAt: now },
          })
        )
      );
      return NextResponse.json({ enrolled: validIds.length });
    }

    case "delete": {
      await prisma.lead.deleteMany({ where: { id: { in: validIds } } });
      return NextResponse.json({ deleted: validIds.length });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
