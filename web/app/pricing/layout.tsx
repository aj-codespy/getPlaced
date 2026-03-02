import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Plans & Credits",
  description: "Choose the perfect plan for your job search. Free, Pro, and Elite tiers with AI resume generation, premium templates, and LinkedIn audit tools.",
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
