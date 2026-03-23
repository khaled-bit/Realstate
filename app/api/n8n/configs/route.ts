import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  const configs = await prisma.n8nConfig.findMany({
    where: { workspaceId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(configs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  const data = await req.json();
  const config = await prisma.n8nConfig.upsert({
    where: { workspaceId_name: { workspaceId, name: data.name } },
    update: { webhookUrl: data.webhookUrl, description: data.description, isActive: data.isActive ?? true },
    create: {
      workspaceId,
      name: data.name,
      webhookUrl: data.webhookUrl,
      description: data.description,
      isActive: data.isActive ?? true,
    },
  });
  return NextResponse.json(config);
}
