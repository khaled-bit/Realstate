import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Papa from "papaparse";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const text = await file.text();

  const { data, errors } = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  if (errors.length > 0) {
    return NextResponse.json({ error: "CSV parse error", details: errors }, { status: 400 });
  }

  let created = 0;
  let failed = 0;
  const failedRows: number[] = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const name = row["Name"] || row["name"];
    if (!name) {
      failed++;
      failedRows.push(i + 2); // +2 for header row and 0-index
      continue;
    }

    try {
      await prisma.lead.create({
        data: {
          workspaceId,
          name,
          email: row["Email"] || row["email"] || null,
          phone: row["Phone"] || row["phone"] || null,
          whatsapp: row["WhatsApp"] || row["whatsapp"] || null,
          country: row["Country"] || row["country"] || "Unknown",
          city: row["City"] || row["city"] || null,
          source: row["Source"] || row["source"] || "Import",
          status: row["Status"] || row["status"] || "New",
          budget: row["Budget"] || row["budget"] ? parseFloat(row["Budget"] || row["budget"]) : null,
          budgetCurrency: row["Currency"] || row["currency"] || "USD",
          propertyType: row["PropertyType"] || row["propertyType"] || null,
          notes: row["Notes"] || row["notes"] || null,
        },
      });
      created++;
    } catch {
      failed++;
      failedRows.push(i + 2);
    }
  }

  return NextResponse.json({ created, failed, failedRows, total: data.length });
}
