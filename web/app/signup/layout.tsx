import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up Free",
  description: "Create your free getPlaced account and generate your first AI-tailored resume in under 30 seconds. No credit card required.",
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
