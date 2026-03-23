import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get("leadId");

  const messages = await prisma.message.findMany({
    where: leadId ? { leadId } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(messages);
}
