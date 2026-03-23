import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get("leadId");
  const agentId = searchParams.get("agentId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  const where: Record<string, unknown> = { workspaceId };
  if (leadId) where.leadId = leadId;
  if (agentId) where.agentId = agentId;

  const [calls, total] = await Promise.all([
    prisma.call.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        lead: { select: { id: true, name: true, phone: true } },
        agent: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.call.count({ where }),
  ]);

  return NextResponse.json({ calls, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  const data = await req.json();

  const lead = await prisma.lead.findUnique({ where: { id: data.leadId, workspaceId } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const call = await prisma.call.create({
    data: {
      workspaceId,
      leadId: data.leadId,
      agentId: data.agentId || session.user.id,
      direction: data.direction || "Outbound",
      duration: data.duration ? parseInt(data.duration) : null,
      notes: data.notes,
      status: data.status || "Completed",
      recordingUrl: data.recordingUrl,
    },
    include: {
      lead: { select: { id: true, name: true, phone: true } },
      agent: { select: { id: true, name: true, email: true } },
    },
  });

  // Log activity
  await prisma.activity.create({
    data: {
      leadId: data.leadId,
      type: "Call",
      content: `${data.direction || "Outbound"} call - ${data.duration ? `${data.duration}s` : "no duration"}. ${data.notes || ""}`.trim(),
      by: session.user.name || "User",
    },
  });

  return NextResponse.json(call, { status: 201 });
}
