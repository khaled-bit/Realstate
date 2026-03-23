import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const templates = await prisma.messageTemplate.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const t = await prisma.messageTemplate.upsert({
    where: { name: data.name },
    update: { body: data.body, subject: data.subject, language: data.language, channel: data.channel },
    create: {
      name: data.name,
      channel: data.channel || "WhatsApp",
      language: data.language || "both",
      subject: data.subject,
      body: data.body,
    },
  });
  return NextResponse.json(t);
}
