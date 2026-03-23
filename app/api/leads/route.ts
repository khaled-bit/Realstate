import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const country = searchParams.get("country");
  const source = searchParams.get("source");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  const where: Record<string, unknown> = { workspaceId };
  if (status) where.status = status;
  if (country) where.country = country;
  if (source) where.source = source;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
    ];
  }

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        _count: { select: { activities: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.lead.count({ where }),
  ]);

  return NextResponse.json({ leads, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  const data = await req.json();
  const lead = await prisma.lead.create({
    data: {
      workspaceId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      whatsapp: data.whatsapp,
      country: data.country,
      city: data.city,
      nationality: data.nationality || "Egyptian",
      source: data.source || "Manual",
      sourceUrl: data.sourceUrl,
      campaign: data.campaign,
      status: data.status || "New",
      budget: data.budget ? parseFloat(data.budget) : null,
      budgetCurrency: data.budgetCurrency || "USD",
      propertyType: data.propertyType,
      preferredAreas: data.preferredAreas,
      notes: data.notes,
      n8nWorkflowId: data.n8nWorkflowId,
      apolloId: data.apolloId,
      externalId: data.externalId,
      assignedToId: data.assignedToId,
    },
  });

  // Create activity
  await prisma.activity.create({
    data: {
      leadId: lead.id,
      type: "Note",
      content: `Lead created via ${lead.source}`,
      by: "System",
    },
  });

  // Auto-welcome WhatsApp (non-blocking)
  if (lead.whatsapp || lead.phone) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    fetch(`${appUrl}/api/comms/auto-welcome`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: lead.id }),
    }).catch(() => {});
  }

  return NextResponse.json(lead, { status: 201 });
}
