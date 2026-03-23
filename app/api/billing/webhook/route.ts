import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const stripe = (await import("stripe")).default;
  const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY);

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event;
  try {
    event = stripeClient.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  const getPlanFromPriceId = (priceId: string): string => {
    if (priceId === process.env.STRIPE_PRO_PRICE_ID) return "pro";
    if (priceId === process.env.STRIPE_STARTER_PRICE_ID) return "starter";
    return "starter";
  };

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as {
        metadata?: { workspaceId?: string };
        customer?: string;
        subscription?: string;
      };
      const workspaceId = session.metadata?.workspaceId;
      if (workspaceId) {
        await prisma.workspace.update({
          where: { id: workspaceId },
          data: {
            stripeCustomerId: session.customer as string,
            stripeSubId: session.subscription as string,
          },
        });
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const sub = event.data.object as {
        id: string;
        customer: string;
        status: string;
        items: { data: Array<{ price: { id: string } }> };
      };
      const workspace = await prisma.workspace.findFirst({
        where: { stripeCustomerId: sub.customer as string },
      });
      if (workspace) {
        const priceId = sub.items.data[0]?.price?.id;
        const plan = priceId ? getPlanFromPriceId(priceId) : workspace.plan;
        await prisma.workspace.update({
          where: { id: workspace.id },
          data: {
            plan: sub.status === "active" ? plan : workspace.plan,
            stripeSubId: sub.id,
          },
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as { customer: string };
      const workspace = await prisma.workspace.findFirst({
        where: { stripeCustomerId: sub.customer as string },
      });
      if (workspace) {
        await prisma.workspace.update({
          where: { id: workspace.id },
          data: { plan: "trial", stripeSubId: null },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
