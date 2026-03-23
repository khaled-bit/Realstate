import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspace = await prisma.workspace.findUnique({
    where: { id: session.user.workspaceId },
    select: { settings: true, name: true, slug: true, plan: true },
  });
  return NextResponse.json(workspace);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["Owner", "Admin"].includes(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, settings } = body;

  const workspace = await prisma.workspace.update({
    where: { id: session.user.workspaceId },
    data: {
      ...(name && { name }),
      ...(settings !== undefined && { settings }),
    },
  });
  return NextResponse.json({ success: true, workspace });
}
