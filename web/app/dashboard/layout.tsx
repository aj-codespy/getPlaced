import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your getPlaced dashboard — manage your resumes, view your ATS scores, and access AI career tools.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
