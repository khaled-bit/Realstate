import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  const { leadId, to, subject, body } = await req.json();

  if (!leadId || !to || !subject || !body) {
    return NextResponse.json({ error: "leadId, to, subject, body required" }, { status: 400 });
  }

  // Verify lead belongs to workspace
  const lead = await prisma.lead.findUnique({ where: { id: leadId, workspaceId } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    // Save as pending without sending
    const msg = await prisma.message.create({
      data: {
        leadId,
        channel: "Email",
        direction: "Outbound",
        content: body,
        subject,
        to,
        status: "Pending",
      },
    });
    return NextResponse.json({
      message: msg,
      sent: false,
      note: "SMTP not configured. Configure SMTP_HOST, SMTP_USER, SMTP_PASS env vars to send emails.",
    });
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text: body,
      html: body.replace(/\n/g, "<br>"),
    });

    const msg = await prisma.message.create({
      data: {
        leadId,
        channel: "Email",
        direction: "Outbound",
        content: body,
        subject,
        to,
        status: "Sent",
      },
    });

    await prisma.activity.create({
      data: {
        leadId,
        type: "Email",
        content: `Email sent: "${subject}"`,
        by: session.user.name || "User",
      },
    });

    await prisma.lead.update({
      where: { id: leadId },
      data: { lastContact: new Date() },
    });

    return NextResponse.json({ message: msg, sent: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to send email", detail: String(err) }, { status: 502 });
  }
}
