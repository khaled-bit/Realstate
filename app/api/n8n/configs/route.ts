import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const configs = await prisma.n8nConfig.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(configs);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const config = await prisma.n8nConfig.upsert({
    where: { name: data.name },
    update: { webhookUrl: data.webhookUrl, description: data.description, isActive: data.isActive ?? true },
    create: {
      name: data.name,
      webhookUrl: data.webhookUrl,
      description: data.description,
      isActive: data.isActive ?? true,
    },
  });
  return NextResponse.json(config);
}
