import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  const sequences = await prisma.sequence.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    include: {
      steps: { orderBy: { stepNumber: "asc" } },
      _count: { select: { enrollments: true } },
    },
  });

  return NextResponse.json(sequences);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  const data = await req.json();

  const sequence = await prisma.sequence.create({
    data: {
      workspaceId,
      name: data.name,
      description: data.description,
      isActive: data.isActive ?? true,
      steps: {
        create: (data.steps || []).map((step: {
          stepNumber: number;
          delayDays: number;
          channel: string;
          subject?: string;
          body: string;
        }) => ({
          stepNumber: step.stepNumber,
          delayDays: step.delayDays || 1,
          channel: step.channel,
          subject: step.subject,
          body: step.body,
        })),
      },
    },
    include: {
      steps: { orderBy: { stepNumber: "asc" } },
      _count: { select: { enrollments: true } },
    },
  });

  return NextResponse.json(sequence, { status: 201 });
}
