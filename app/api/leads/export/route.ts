import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  const leads = await prisma.lead.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    select: {
      name: true,
      email: true,
      phone: true,
      whatsapp: true,
      country: true,
      city: true,
      source: true,
      status: true,
      budget: true,
      budgetCurrency: true,
      propertyType: true,
      notes: true,
      createdAt: true,
    },
  });

  const headers = [
    "Name", "Email", "Phone", "WhatsApp", "Country", "City",
    "Source", "Status", "Budget", "Currency", "PropertyType", "Notes", "CreatedAt",
  ];

  const escapeCSV = (val: unknown): string => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = leads.map((lead) => [
    lead.name,
    lead.email,
    lead.phone,
    lead.whatsapp,
    lead.country,
    lead.city,
    lead.source,
    lead.status,
    lead.budget,
    lead.budgetCurrency,
    lead.propertyType,
    lead.notes,
    lead.createdAt.toISOString(),
  ].map(escapeCSV).join(","));

  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
