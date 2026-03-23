import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await req.json();

  const activity = await prisma.activity.create({
    data: {
      leadId: id,
      type: data.type || "Note",
      content: data.content,
      by: data.by || "User",
    },
  });

  // Update lastContact if it's a contact activity
  if (["Call", "Email", "WhatsApp"].includes(data.type)) {
    await prisma.lead.update({
      where: { id },
      data: { lastContact: new Date() },
    });
  }

  return NextResponse.json(activity, { status: 201 });
}
