import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id, workspaceId },
    include: {
      activities: { orderBy: { createdAt: "desc" } },
      properties: { include: { property: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(lead);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  const { id } = await params;
  const data = await req.json();

  const current = await prisma.lead.findUnique({ where: { id, workspaceId } });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Remove fields that shouldn't be directly set
  const { updatedBy, workspaceId: _ws, ...updateData } = data;

  const lead = await prisma.lead.update({
    where: { id },
    data: {
      ...updateData,
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
        by: updatedBy || session.user.name || "User",
      },
    });
  }

  return NextResponse.json(lead);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id, workspaceId } });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.lead.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
