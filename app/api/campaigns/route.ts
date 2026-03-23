import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  const campaigns = await prisma.campaign.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(campaigns);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  const data = await req.json();
  const campaign = await prisma.campaign.create({
    data: {
      workspaceId,
      name: data.name,
      type: data.type,
      status: "Draft",
      targetCountries: Array.isArray(data.targetCountries)
        ? data.targetCountries.join(",")
        : data.targetCountries,
      n8nWorkflowId: data.n8nWorkflowId,
    },
  });
  return NextResponse.json(campaign, { status: 201 });
}
