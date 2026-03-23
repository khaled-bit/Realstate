import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  const { id } = await params;
  const data = await req.json();

  const existing = await prisma.call.findUnique({ where: { id, workspaceId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const call = await prisma.call.update({
    where: { id },
    data: {
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.recordingUrl !== undefined && { recordingUrl: data.recordingUrl }),
      ...(data.duration !== undefined && { duration: data.duration ? parseInt(data.duration) : null }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.twilioCallId !== undefined && { twilioCallId: data.twilioCallId }),
    },
    include: {
      lead: { select: { id: true, name: true, phone: true } },
      agent: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(call);
}
