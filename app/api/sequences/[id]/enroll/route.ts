import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  const { id } = await params;
  const { leadIds } = await req.json();

  if (!Array.isArray(leadIds) || leadIds.length === 0) {
    return NextResponse.json({ error: "leadIds array required" }, { status: 400 });
  }

  const sequence = await prisma.sequence.findUnique({ where: { id, workspaceId } });
  if (!sequence) return NextResponse.json({ error: "Sequence not found" }, { status: 404 });

  // Verify all leads belong to workspace
  const leads = await prisma.lead.findMany({
    where: { id: { in: leadIds }, workspaceId },
    select: { id: true },
  });

  const validLeadIds = leads.map((l) => l.id);
  const now = new Date();

  // Upsert enrollments (skip already enrolled)
  const results = await Promise.allSettled(
    validLeadIds.map((leadId) =>
      prisma.sequenceEnrollment.upsert({
        where: { sequenceId_leadId: { sequenceId: id, leadId } },
        update: { status: "Active", currentStep: 0, startedAt: now, nextRunAt: now },
        create: {
          sequenceId: id,
          leadId,
          currentStep: 0,
          status: "Active",
          startedAt: now,
          nextRunAt: now,
        },
      })
    )
  );

  const enrolled = results.filter((r) => r.status === "fulfilled").length;
  return NextResponse.json({ enrolled, total: validLeadIds.length });
}
