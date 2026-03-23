import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  const data = await req.json();
  const { workflowName, payload } = data;

  const config = await prisma.n8nConfig.findUnique({
    where: { workspaceId_name: { workspaceId, name: workflowName } },
  });

  if (!config) {
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  }

  if (!config.isActive) {
    return NextResponse.json({ error: "Workflow is disabled" }, { status: 400 });
  }

  try {
    const response = await fetch(config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "leads-egypt-crm",
        timestamp: new Date().toISOString(),
        ...payload,
      }),
    });

    await prisma.n8nConfig.update({
      where: { workspaceId_name: { workspaceId, name: workflowName } },
      data: { lastTriggered: new Date() },
    });

    const result = response.ok ? await response.json().catch(() => ({})) : null;

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      result,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to reach n8n", detail: String(err) },
      { status: 502 }
    );
  }
}
