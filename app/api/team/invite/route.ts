import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  const invites = await prisma.invite.findMany({
    where: { workspaceId, accepted: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invites);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  if (!["Owner", "Admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email, role } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  // Check if user already exists in workspace
  const existing = await prisma.user.findFirst({ where: { email, workspaceId } });
  if (existing) return NextResponse.json({ error: "User already in workspace" }, { status: 400 });

  // Create or update invite
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invite = await prisma.invite.create({
    data: {
      workspaceId,
      email,
      role: role || "Agent",
      expiresAt,
    },
  });

  const inviteUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/register?token=${invite.token}`;

  return NextResponse.json({ invite, inviteUrl });
}
