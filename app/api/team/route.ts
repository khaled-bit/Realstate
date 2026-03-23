import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  const users = await prisma.user.findMany({
    where: { workspaceId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      createdAt: true,
      _count: { select: { assignedLeads: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  // Only owners/admins can change roles
  if (!["Owner", "Admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, role } = await req.json();

  // Verify user belongs to workspace
  const user = await prisma.user.findUnique({ where: { id: userId, workspaceId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Can't change Owner role
  if (user.role === "Owner") {
    return NextResponse.json({ error: "Cannot change Owner role" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  if (!["Owner", "Admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await req.json();
  const user = await prisma.user.findUnique({ where: { id: userId, workspaceId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.role === "Owner") return NextResponse.json({ error: "Cannot remove Owner" }, { status: 400 });
  if (userId === session.user.id) return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });

  // Unassign their leads before removal
  await prisma.lead.updateMany({ where: { workspaceId, assignedToId: userId }, data: { assignedToId: null } });
  await prisma.user.delete({ where: { id: userId } });

  return NextResponse.json({ success: true });
}
