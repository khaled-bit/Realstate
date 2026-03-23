import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  const [
    totalLeads,
    byStatus,
    byCountry,
    bySource,
    recentLeads,
    monthlyLeads,
  ] = await Promise.all([
    prisma.lead.count({ where: { workspaceId } }),
    prisma.lead.groupBy({ by: ["status"], where: { workspaceId }, _count: { status: true } }),
    prisma.lead.groupBy({ by: ["country"], where: { workspaceId }, _count: { country: true }, orderBy: { _count: { country: "desc" } } }),
    prisma.lead.groupBy({ by: ["source"], where: { workspaceId }, _count: { source: true }, orderBy: { _count: { source: "desc" } } }),
    prisma.lead.count({
      where: {
        workspaceId,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.lead.count({
      where: {
        workspaceId,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const deals = byStatus.find((s) => s.status === "Deal")?._count.status || 0;
  const qualified = byStatus.find((s) => s.status === "Qualified")?._count.status || 0;

  return NextResponse.json({
    totalLeads,
    deals,
    qualified,
    recentLeads,
    monthlyLeads,
    conversionRate: totalLeads > 0 ? ((deals / totalLeads) * 100).toFixed(1) : "0",
    byStatus,
    byCountry,
    bySource,
  });
}
