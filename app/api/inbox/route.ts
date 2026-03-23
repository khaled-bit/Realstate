import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  const { searchParams } = new URL(req.url);
  const channel = searchParams.get("channel"); // WhatsApp | Email | SMS | null (all)

  const messages = await prisma.message.findMany({
    where: {
      lead: { workspaceId },
      ...(channel ? { channel } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      lead: {
        select: {
          id: true,
          name: true,
          country: true,
          phone: true,
          whatsapp: true,
          email: true,
        },
      },
    },
  });

  // Group by leadId to get conversations
  const conversationMap = new Map<string, {
    lead: typeof messages[0]["lead"];
    latestMessage: typeof messages[0];
    messageCount: number;
    unread: boolean;
  }>();

  for (const msg of messages) {
    if (!conversationMap.has(msg.leadId)) {
      conversationMap.set(msg.leadId, {
        lead: msg.lead,
        latestMessage: msg,
        messageCount: 1,
        unread: msg.direction === "Inbound" && msg.status !== "Read",
      });
    } else {
      const conv = conversationMap.get(msg.leadId)!;
      conv.messageCount++;
      if (msg.direction === "Inbound" && msg.status !== "Read") {
        conv.unread = true;
      }
    }
  }

  const conversations = Array.from(conversationMap.values()).sort(
    (a, b) => b.latestMessage.createdAt.getTime() - a.latestMessage.createdAt.getTime()
  );

  return NextResponse.json({ conversations, messages });
}
