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
  const sequence = await prisma.sequence.findUnique({
    where: { id, workspaceId },
    include: {
      steps: { orderBy: { stepNumber: "asc" } },
      _count: { select: { enrollments: true } },
    },
  });

  if (!sequence) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(sequence);
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

  const existing = await prisma.sequence.findUnique({ where: { id, workspaceId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // If steps provided, replace all steps
  if (data.steps) {
    await prisma.sequenceStep.deleteMany({ where: { sequenceId: id } });
    await prisma.sequenceStep.createMany({
      data: data.steps.map((step: {
        stepNumber: number;
        delayDays: number;
        channel: string;
        subject?: string;
        body: string;
      }) => ({
        sequenceId: id,
        stepNumber: step.stepNumber,
        delayDays: step.delayDays || 1,
        channel: step.channel,
        subject: step.subject,
        body: step.body,
      })),
    });
  }

  const sequence = await prisma.sequence.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    include: {
      steps: { orderBy: { stepNumber: "asc" } },
      _count: { select: { enrollments: true } },
    },
  });

  return NextResponse.json(sequence);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  const { id } = await params;
  const existing = await prisma.sequence.findUnique({ where: { id, workspaceId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.sequence.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
