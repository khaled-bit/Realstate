import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [
    totalLeads,
    byStatus,
    byCountry,
    bySource,
    recentLeads,
    monthlyLeads,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.lead.groupBy({ by: ["country"], _count: { country: true }, orderBy: { _count: { country: "desc" } } }),
    prisma.lead.groupBy({ by: ["source"], _count: { source: true }, orderBy: { _count: { source: "desc" } } }),
    prisma.lead.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.lead.count({
      where: {
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
