import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  const templates = await prisma.messageTemplate.findMany({
    where: { workspaceId, isActive: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  const data = await req.json();
  const t = await prisma.messageTemplate.upsert({
    where: { workspaceId_name: { workspaceId, name: data.name } },
    update: { body: data.body, subject: data.subject, language: data.language, channel: data.channel },
    create: {
      workspaceId,
      name: data.name,
      channel: data.channel || "WhatsApp",
      language: data.language || "both",
      subject: data.subject,
      body: data.body,
    },
  });
  return NextResponse.json(t);
}
