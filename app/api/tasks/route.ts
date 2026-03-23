import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get("leadId");
  const completed = searchParams.get("completed");
  const assignedToId = searchParams.get("assignedToId");

  const where: Record<string, unknown> = { workspaceId };
  if (leadId) where.leadId = leadId;
  if (assignedToId) where.assignedToId = assignedToId;
  if (completed !== null) where.completed = completed === "true";

  const tasks = await prisma.task.findMany({
    where,
    orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    include: {
      lead: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  const data = await req.json();

  // Verify lead belongs to workspace if provided
  if (data.leadId) {
    const lead = await prisma.lead.findUnique({ where: { id: data.leadId, workspaceId } });
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const task = await prisma.task.create({
    data: {
      workspaceId,
      title: data.title,
      notes: data.notes,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      priority: data.priority || "Medium",
      leadId: data.leadId || null,
      assignedToId: data.assignedToId || null,
    },
    include: {
      lead: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(task, { status: 201 });
}
