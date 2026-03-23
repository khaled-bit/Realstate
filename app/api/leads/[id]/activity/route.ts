import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  const { id } = await params;
  const data = await req.json();

  // Verify lead belongs to workspace
  const lead = await prisma.lead.findUnique({ where: { id, workspaceId } });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const activity = await prisma.activity.create({
    data: {
      leadId: id,
      type: data.type || "Note",
      content: data.content,
      by: data.by || session.user.name || "User",
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
