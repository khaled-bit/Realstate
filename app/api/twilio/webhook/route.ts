import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const callSid = formData.get("CallSid") as string;
  const callStatus = formData.get("CallStatus") as string;
  const callDuration = formData.get("CallDuration") as string;
  const recordingUrl = formData.get("RecordingUrl") as string;

  if (callSid) {
    const callRecord = await prisma.call.findFirst({
      where: { twilioCallId: callSid },
    });

    if (callRecord) {
      await prisma.call.update({
        where: { id: callRecord.id },
        data: {
          status: mapTwilioStatus(callStatus),
          duration: callDuration ? parseInt(callDuration) : null,
          recordingUrl: recordingUrl || null,
        },
      });
    }
  }

  // Return TwiML response
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Thank you for calling. Goodbye.</Say>
</Response>`;

  return new NextResponse(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}

function mapTwilioStatus(status: string): string {
  const map: Record<string, string> = {
    completed: "Completed",
    failed: "Failed",
    busy: "Busy",
    "no-answer": "NoAnswer",
    canceled: "Canceled",
    initiated: "Initiated",
    ringing: "Ringing",
    "in-progress": "InProgress",
  };
  return map[status] || status;
}
