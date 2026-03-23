import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      activities: { orderBy: { createdAt: "desc" } },
      properties: { include: { property: true } },
    },
  });

  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(lead);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await req.json();

  const current = await prisma.lead.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const lead = await prisma.lead.update({
    where: { id },
    data: {
      ...data,
      budget: data.budget ? parseFloat(data.budget) : current.budget,
      updatedAt: new Date(),
    },
  });

  // Track status change
  if (data.status && data.status !== current.status) {
    await prisma.activity.create({
      data: {
        leadId: id,
        type: "StatusChange",
        content: `Status changed from ${current.status} to ${data.status}`,
        by: data.updatedBy || "User",
      },
    });
  }

  return NextResponse.json(lead);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.lead.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
