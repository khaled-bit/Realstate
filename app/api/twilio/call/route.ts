import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    return NextResponse.json({
      error: "Twilio not configured",
      note: "Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER env vars",
    }, { status: 503 });
  }

  const { leadId, to } = await req.json();

  let lead = null;
  if (leadId) {
    lead = await prisma.lead.findUnique({ where: { id: leadId, workspaceId } });
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const phoneNumber = to || lead?.phone || lead?.whatsapp;
  if (!phoneNumber) return NextResponse.json({ error: "Phone number required" }, { status: 400 });

  try {
    const twilio = await import("twilio");
    const client = twilio.default(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    const call = await client.calls.create({
      from: TWILIO_PHONE_NUMBER,
      to: phoneNumber,
      url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/twilio/webhook`,
    });

    // Create call record
    let callRecord = null;
    if (leadId) {
      callRecord = await prisma.call.create({
        data: {
          workspaceId,
          leadId,
          agentId: session.user.id,
          direction: "Outbound",
          status: "Initiated",
          twilioCallId: call.sid,
        },
      });

      await prisma.activity.create({
        data: {
          leadId,
          type: "Call",
          content: `Outbound call initiated to ${phoneNumber}`,
          by: session.user.name || "User",
        },
      });
    }

    return NextResponse.json({ callSid: call.sid, callRecord });
  } catch (err) {
    return NextResponse.json({ error: "Failed to initiate call", detail: String(err) }, { status: 500 });
  }
}
