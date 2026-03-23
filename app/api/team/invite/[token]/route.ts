import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { workspace: { select: { name: true, slug: true } } },
  });

  if (!invite) return NextResponse.json({ error: "Invalid invite" }, { status: 404 });
  if (invite.accepted) return NextResponse.json({ error: "Invite already used" }, { status: 400 });
  if (invite.expiresAt < new Date()) return NextResponse.json({ error: "Invite expired" }, { status: 400 });

  return NextResponse.json({
    email: invite.email,
    role: invite.role,
    workspace: invite.workspace,
    expiresAt: invite.expiresAt,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const { name, password } = await req.json();

  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { workspace: true },
  });

  if (!invite) return NextResponse.json({ error: "Invalid invite" }, { status: 404 });
  if (invite.accepted) return NextResponse.json({ error: "Invite already used" }, { status: 400 });
  if (invite.expiresAt < new Date()) return NextResponse.json({ error: "Invite expired" }, { status: 400 });

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email: invite.email } });
  if (existingUser) {
    // Just add to workspace
    await prisma.invite.update({ where: { token }, data: { accepted: true } });
    return NextResponse.json({ success: true, message: "Account already exists, please log in" });
  }

  if (!password) return NextResponse.json({ error: "Password required" }, { status: 400 });

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email: invite.email,
      name: name || invite.email.split("@")[0],
      password: hashedPassword,
      role: invite.role,
      workspaceId: invite.workspaceId,
    },
  });

  await prisma.invite.update({ where: { token }, data: { accepted: true } });

  return NextResponse.json({ success: true, userId: user.id });
}
