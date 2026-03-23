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
  const month = searchParams.get("month"); // YYYY-MM format

  const where: Record<string, unknown> = { workspaceId };
  if (leadId) where.leadId = leadId;
  if (agentId) where.agentId = agentId;
  if (month) {
    const [year, m] = month.split("-").map(Number);
    const start = new Date(year, m - 1, 1);
    const end = new Date(year, m, 1);
    where.date = { gte: start, lt: end };
  }

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: { date: "asc" },
    include: {
      lead: { select: { id: true, name: true } },
      agent: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(appointments);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  const data = await req.json();

  if (data.leadId) {
    const lead = await prisma.lead.findUnique({ where: { id: data.leadId, workspaceId } });
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const appointment = await prisma.appointment.create({
    data: {
      workspaceId,
      title: data.title,
      date: new Date(data.date),
      duration: data.duration ? parseInt(data.duration) : 60,
      location: data.location,
      notes: data.notes,
      leadId: data.leadId || null,
      agentId: data.agentId || null,
    },
    include: {
      lead: { select: { id: true, name: true } },
      agent: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(appointment, { status: 201 });
}
