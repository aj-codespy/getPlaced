export type BillingCurrency = "INR" | "USD";

type PlanConfig = {
  id: "plan_standard" | "plan_pro";
  name: string;
  planType: "standard" | "pro";
  isPremium: 1 | 2;
  credits: number;
  period: "monthly";
  type: "subscription";
  features: string[];
  price: {
    INR: number;
    USD: number;
  };
  dodoProductId: {
    INR: string;
    USD: string;
  };
};

export const PRICING_PLANS: Record<"STANDARD" | "PRO", PlanConfig> = {
  STANDARD: {
    id: "plan_standard",
    name: "Standard Plan",
    planType: "standard",
    isPremium: 1,
    credits: 900, // 9 Resumes per month
    period: "monthly",
    type: "subscription",
    features: [
      "9 Resume Generations / month",
      "1 LinkedIn Profile Audit / month",
      "Standard Templates",
      "ATS Keyword Optimization",
    ],
    price: {
      INR: 129,
      USD: 3.99,
    },
    dodoProductId: {
      INR: process.env.DODO_PRODUCT_ID_STANDARD_INR || "pdt_0NbPnI0p4tBHBoUH9QXAp",
      USD: process.env.DODO_PRODUCT_ID_STANDARD_USD || "pdt_0NbPm2bcYNCLAy3r1YGHv",
    },
  },
  PRO: {
    id: "plan_pro",
    name: "Pro Plan",
    planType: "pro",
    isPremium: 2,
    credits: 2500, // 25 Resumes per month
    period: "monthly",
    type: "subscription",
    features: [
      "25 Resume Generations / month",
      "3 LinkedIn Profile Audits / month",
      "Premium Templates (Publication/Academic)",
      "Priority AI Processing",
      "Cover Letter Generator (Coming Soon)",
    ],
    price: {
      INR: 299,
      USD: 8.99,
    },
    dodoProductId: {
      INR: process.env.DODO_PRODUCT_ID_PRO_INR || "pdt_0NbPnQl3VYLwC8jHaU4wo",
      USD: process.env.DODO_PRODUCT_ID_PRO_USD || "pdt_0NbPmFNx2kw1gRVX3Kdhe",
    },
  },
};

export const EXCHANGE_RATE_INR_USD = 84; // Fallback conversion if needed

export function findPlanById(planId: string) {
  return Object.values(PRICING_PLANS).find((plan) => plan.id === planId);
}

export function findPlanByDodoProductId(productId: string) {
  return Object.values(PRICING_PLANS).find(
    (plan) => plan.dodoProductId.INR === productId || plan.dodoProductId.USD === productId,
  );
}

export function getDodoProductId(planId: string, currency: BillingCurrency) {
  const plan = findPlanById(planId);
  if (!plan) return null;
  return plan.dodoProductId[currency] || null;
}
