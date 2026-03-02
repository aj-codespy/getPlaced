import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resume Builder",
  description: "Build your AI-tailored resume. Pick a template, paste the job description, and generate an ATS-optimized resume in seconds.",
};

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
