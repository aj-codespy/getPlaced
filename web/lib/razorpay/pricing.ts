
export const PRICING_PLANS = {
  STANDARD: {
    id: "plan_standard",
    name: "Standard Plan",
    credits: 900, // 9 Resumes per month
    period: "monthly" as const,
    type: "subscription" as const,
    features: [
      "9 Resume Generations / month",
      "1 LinkedIn Profile Audit / month",
      "Standard Templates",
      "ATS Keyword Optimization"
    ],
    price: {
      INR: 129,
      USD: 3.99
    }
  },
  PRO: {
    id: "plan_pro",
    name: "Pro Plan",
    credits: 2500, // 25 Resumes per month
    period: "monthly" as const,
    type: "subscription" as const,
    features: [
      "25 Resume Generations / month",
      "3 LinkedIn Profile Audits / month",
      "Premium Templates (Publication/Academic)",
      "Priority AI Processing",
      "Cover Letter Generator (Coming Soon)"
    ],
    price: {
      INR: 299,
      USD: 8.99
    }
  }
};

export const EXCHANGE_RATE_INR_USD = 84; // Fallback conversion if needed
