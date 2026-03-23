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

  // Get SMTP config: prefer workspace settings over env vars
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { settings: true } });
  const ws = (workspace?.settings as Record<string, string> | null) || {};

  const smtpHost = ws.smtpHost || process.env.SMTP_HOST;
  const smtpPort = ws.smtpPort || process.env.SMTP_PORT || "587";
  const smtpUser = ws.smtpUser || process.env.SMTP_USER;
  const smtpPass = ws.smtpPass || process.env.SMTP_PASS;
  const smtpFrom = ws.smtpFrom || process.env.SMTP_FROM || smtpUser;

  if (!smtpHost || !smtpUser) {
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
      note: "SMTP not configured. Set up SMTP in Settings → Email.",
    });
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort),
    secure: smtpPort === "465",
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  try {
    await transporter.sendMail({
      from: smtpFrom,
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
