import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "30d";

  const daysMap: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
  const days = daysMap[range];
  const since = days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : new Date(0);

  const [
    totalLeads,
    byStatus,
    bySource,
    byMonth,
    topAgents,
    budgetByStatus,
    recentLeads,
  ] = await Promise.all([
    prisma.lead.count({ where: { workspaceId, createdAt: { gte: since } } }),
    prisma.lead.groupBy({
      by: ["status"],
      where: { workspaceId, createdAt: { gte: since } },
      _count: { status: true },
    }),
    prisma.lead.groupBy({
      by: ["source"],
      where: { workspaceId, createdAt: { gte: since } },
      _count: { source: true },
      orderBy: { _count: { source: "desc" } },
    }),
    // Leads by month (last 12 months regardless of range)
    prisma.$queryRaw<Array<{ month: string; count: bigint }>>`
      SELECT to_char("createdAt", 'YYYY-MM') as month, COUNT(*)::bigint as count
      FROM "Lead"
      WHERE "workspaceId" = ${workspaceId}
        AND "createdAt" >= NOW() - INTERVAL '12 months'
      GROUP BY month
      ORDER BY month ASC
    `,
    // Top agents by leads assigned
    prisma.user.findMany({
      where: { workspaceId },
      select: {
        id: true,
        name: true,
        _count: { select: { assignedLeads: true } },
      },
      orderBy: { assignedLeads: { _count: "desc" } },
      take: 10,
    }),
    // Budget/revenue by status
    prisma.lead.groupBy({
      by: ["status"],
      where: { workspaceId, budget: { not: null } },
      _sum: { budget: true },
      _count: { status: true },
    }),
    // Leads created per day in range
    prisma.lead.count({ where: { workspaceId, createdAt: { gte: since } } }),
  ]);

  const wonLeads = byStatus.find((s) => s.status === "Won" || s.status === "Deal");
  const conversionRate = totalLeads > 0
    ? (((wonLeads?._count.status || 0) / totalLeads) * 100).toFixed(1)
    : "0";

  // Conversion by source
  const allSourceLeads = await prisma.lead.groupBy({
    by: ["source", "status"],
    where: { workspaceId, createdAt: { gte: since } },
    _count: { status: true },
  });

  const sourceConversion = bySource.map((s) => {
    const wonFromSource = allSourceLeads
      .filter((l) => l.source === s.source && (l.status === "Won" || l.status === "Deal"))
      .reduce((acc, l) => acc + l._count.status, 0);
    return {
      source: s.source,
      total: s._count.source,
      won: wonFromSource,
      rate: s._count.source > 0 ? ((wonFromSource / s._count.source) * 100).toFixed(1) : "0",
    };
  });

  const totalPipelineValue = budgetByStatus.reduce((acc, b) => acc + (b._sum.budget || 0), 0);

  return NextResponse.json({
    totalLeads,
    conversionRate,
    totalPipelineValue,
    byStatus,
    bySource,
    byMonth: byMonth.map((m) => ({ month: m.month, count: Number(m.count) })),
    topAgents: topAgents.map((a) => ({ ...a, leadsCount: a._count.assignedLeads })),
    sourceConversion,
    budgetByStatus,
    recentLeads,
  });
}
