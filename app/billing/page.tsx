"use client";

import { useEffect, useState } from "react";
import { CreditCard, Check, AlertCircle, ExternalLink } from "lucide-react";

type BillingData = {
  plan: string;
  seats: number;
  trialEndsAt: string | null;
  trialDaysLeft: number | null;
  hasStripe: boolean;
  hasSubscription: boolean;
  usage: {
    leads: number;
    agents: number;
  };
};

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "$29",
    period: "/mo",
    features: [
      "Up to 3 agents",
      "1,000 leads",
      "WhatsApp & Email",
      "Basic analytics",
      "CSV export",
    ],
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$79",
    period: "/mo",
    features: [
      "Unlimited agents",
      "Unlimited leads",
      "All channels",
      "Advanced analytics",
      "Drip sequences",
      "Kanban board",
      "Twilio calling",
      "Priority support",
    ],
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    features: [
      "Everything in Pro",
      "White-labeling",
      "Custom integrations",
      "Dedicated support",
      "SLA guarantee",
    ],
    highlighted: false,
  },
];

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/billing")
      .then((r) => r.json())
      .then(setBilling)
      .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async (planId: string) => {
    if (planId === "enterprise") {
      window.open("mailto:sales@leadsegypt.com?subject=Enterprise Plan Inquiry", "_blank");
      return;
    }
    setUpgrading(planId);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Failed to create checkout session");
      }
    } catch {
      setError("Failed to initiate checkout. Please try again.");
    } finally {
      setUpgrading(null);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Failed to open billing portal");
      }
    } catch {
      setError("Failed to open billing portal");
    } finally {
      setPortalLoading(false);
    }
  };

  const PLAN_LABELS: Record<string, string> = {
    trial: "Trial",
    starter: "Starter",
    pro: "Pro",
    enterprise: "Enterprise",
  };

  const currentPlanLabel = billing ? (PLAN_LABELS[billing.plan] || billing.plan) : "";

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="h-8 bg-slate-200 rounded w-40 mb-8 animate-pulse" />
        <div className="grid grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card animate-pulse h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Billing</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your subscription and plan</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-700">{error}</p>
            {error.includes("Stripe not configured") && (
              <p className="text-xs text-red-600 mt-1">
                Add STRIPE_SECRET_KEY, STRIPE_STARTER_PRICE_ID, and STRIPE_PRO_PRICE_ID to your environment variables.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Current plan */}
      {billing && (
        <div className="card mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold text-slate-900">Current Plan</h2>
              </div>
              <div className="mt-3 flex items-center gap-3 flex-wrap">
                <span className={`text-lg font-bold px-3 py-1 rounded-full ${
                  billing.plan === "pro" ? "bg-blue-100 text-blue-800" :
                  billing.plan === "enterprise" ? "bg-purple-100 text-purple-800" :
                  billing.plan === "trial" ? "bg-orange-100 text-orange-800" :
                  "bg-slate-100 text-slate-800"
                }`}>
                  {currentPlanLabel}
                </span>
                {billing.plan === "trial" && billing.trialDaysLeft !== null && (
                  <span className={`text-sm font-medium ${billing.trialDaysLeft <= 3 ? "text-red-600" : "text-orange-600"}`}>
                    {billing.trialDaysLeft} days remaining
                  </span>
                )}
              </div>
            </div>
            {billing.hasSubscription && (
              <button
                onClick={handlePortal}
                disabled={portalLoading}
                className="btn-secondary flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                {portalLoading ? "Opening..." : "Manage Subscription"}
              </button>
            )}
          </div>

          {/* Usage */}
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 max-w-sm">
            <div>
              <p className="text-xs text-slate-500">Leads</p>
              <p className="text-xl font-bold text-slate-900">{billing.usage.leads.toLocaleString()}</p>
              {billing.plan === "starter" && (
                <div className="mt-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${Math.min(100, (billing.usage.leads / 1000) * 100)}%` }}
                  />
                </div>
              )}
            </div>
            <div>
              <p className="text-xs text-slate-500">Agents</p>
              <p className="text-xl font-bold text-slate-900">{billing.usage.agents}</p>
              {billing.plan === "starter" && (
                <div className="mt-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${Math.min(100, (billing.usage.agents / 3) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pricing cards */}
      <h2 className="font-semibold text-slate-900 mb-4">Plans</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const isCurrent = billing?.plan === plan.id;
          return (
            <div
              key={plan.id}
              className={`relative rounded-xl border-2 p-6 flex flex-col ${
                plan.highlighted
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 right-4 bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Current
                </div>
              )}
              <div className="mb-4">
                <h3 className="font-bold text-slate-900 text-lg">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                  <span className="text-slate-500">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
                    <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={isCurrent || upgrading === plan.id}
                className={`w-full py-2.5 rounded-lg font-medium text-sm transition-colors ${
                  isCurrent
                    ? "bg-green-100 text-green-700 cursor-default"
                    : plan.highlighted
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-slate-900 text-white hover:bg-slate-700"
                }`}
              >
                {isCurrent
                  ? "Current Plan"
                  : upgrading === plan.id
                  ? "Redirecting..."
                  : plan.id === "enterprise"
                  ? "Contact Sales"
                  : `Upgrade to ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-400 text-center mt-8">
        Payments are processed securely by Stripe. Cancel anytime.
      </p>
    </div>
  );
}
