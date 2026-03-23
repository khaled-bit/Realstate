import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Cron endpoint - process due sequence steps
// POST /api/sequences/run
// Called by cron job or n8n
export async function POST() {
  const now = new Date();

  // Find all active enrollments where nextRunAt is due
  const dueEnrollments = await prisma.sequenceEnrollment.findMany({
    where: {
      status: "Active",
      nextRunAt: { lte: now },
    },
    include: {
      lead: true,
      sequence: {
        include: {
          steps: { orderBy: { stepNumber: "asc" } },
        },
      },
    },
    take: 100,
  });

  let processed = 0;
  let errors = 0;

  for (const enrollment of dueEnrollments) {
    const { sequence, lead } = enrollment;
    const steps = sequence.steps;
    const nextStep = steps.find((s) => s.stepNumber === enrollment.currentStep + 1)
      || steps[enrollment.currentStep];

    if (!nextStep) {
      // Sequence complete
      await prisma.sequenceEnrollment.update({
        where: { id: enrollment.id },
        data: { status: "Completed" },
      });
      continue;
    }

    try {
      // Send the message via n8n
      const workspaceId = sequence.workspaceId;
      const workflowName = nextStep.channel === "Email" ? "email-send" : "whatsapp-send";
      const config = await prisma.n8nConfig.findUnique({
        where: { workspaceId_name: { workspaceId, name: workflowName } },
      });

      const phone = lead.whatsapp || lead.phone;
      const message = nextStep.body
        .replace("{{name}}", lead.name)
        .replace("{{country}}", lead.country);

      if (config?.isActive && phone) {
        await fetch(config.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: "sequence-runner",
            leadId: lead.id,
            name: lead.name,
            phone: nextStep.channel === "Email" ? lead.email : phone,
            email: lead.email,
            channel: nextStep.channel,
            subject: nextStep.subject,
            message,
            sequenceId: sequence.id,
            stepNumber: nextStep.stepNumber,
          }),
        }).catch(() => {});
      }

      // Log message
      await prisma.message.create({
        data: {
          leadId: lead.id,
          channel: nextStep.channel,
          direction: "Outbound",
          content: message,
          subject: nextStep.subject,
          status: config?.isActive ? "Sent" : "Pending",
        },
      });

      // Log activity
      await prisma.activity.create({
        data: {
          leadId: lead.id,
          type: nextStep.channel,
          content: `Sequence "${sequence.name}" step ${nextStep.stepNumber}: ${message.slice(0, 80)}`,
          by: "System",
        },
      });

      // Advance to next step
      const isLastStep = nextStep.stepNumber >= steps.length;
      const nextStepData = steps.find((s) => s.stepNumber === nextStep.stepNumber + 1);

      await prisma.sequenceEnrollment.update({
        where: { id: enrollment.id },
        data: {
          currentStep: nextStep.stepNumber,
          status: isLastStep ? "Completed" : "Active",
          nextRunAt: isLastStep
            ? null
            : new Date(now.getTime() + (nextStepData?.delayDays || 1) * 24 * 60 * 60 * 1000),
        },
      });

      processed++;
    } catch {
      errors++;
      await prisma.sequenceEnrollment.update({
        where: { id: enrollment.id },
        data: { status: "Paused" },
      });
    }
  }

  return NextResponse.json({ processed, errors, total: dueEnrollments.length });
}
