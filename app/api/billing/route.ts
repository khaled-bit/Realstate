import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      plan: true,
      stripeCustomerId: true,
      stripeSubId: true,
      trialEndsAt: true,
      seats: true,
      _count: { select: { leads: true, users: true } },
    },
  });

  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  const trialDaysLeft = workspace.trialEndsAt
    ? Math.max(0, Math.ceil((workspace.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return NextResponse.json({
    plan: workspace.plan,
    seats: workspace.seats,
    trialEndsAt: workspace.trialEndsAt,
    trialDaysLeft,
    hasStripe: !!workspace.stripeCustomerId,
    hasSubscription: !!workspace.stripeSubId,
    usage: {
      leads: workspace._count.leads,
      agents: workspace._count.users,
    },
  });
}
