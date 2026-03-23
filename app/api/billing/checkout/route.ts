import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = session.user.workspaceId;

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const { plan } = await req.json();
  const priceId = plan === "pro"
    ? process.env.STRIPE_PRO_PRICE_ID
    : process.env.STRIPE_STARTER_PRICE_ID;

  if (!priceId) {
    return NextResponse.json({ error: "Price ID not configured for this plan" }, { status: 503 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { stripeCustomerId: true, name: true },
  });

  const stripe = (await import("stripe")).default;
  const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY);

  const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  const checkoutSession = await stripeClient.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer: workspace?.stripeCustomerId || undefined,
    customer_email: workspace?.stripeCustomerId ? undefined : session.user.email || undefined,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/billing?success=true`,
    cancel_url: `${appUrl}/billing`,
    metadata: { workspaceId },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
