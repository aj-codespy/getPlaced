"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import {
  Loader2,
  Coins,
  WalletCards,
  FileText,
  Linkedin,
  BarChart3,
  ArrowRight,
} from "lucide-react";

type TimestampLike = {
  toDate?: () => Date;
  toMillis?: () => number;
};

type ResumeSummary = {
  id: string;
  title?: string;
  targetRole?: string;
  templateId?: string;
  createdAt?: TimestampLike;
};

type DownloadSummary = {
  id: string;
  filename?: string;
  templateId?: string;
  resumeId?: string | null;
  createdAt?: TimestampLike;
};

type SummaryPayload = {
  user?: Record<string, unknown>;
  profile?: Record<string, unknown> | null;
  resumes?: ResumeSummary[];
  downloads?: DownloadSummary[];
};

function isProfileComplete(profile: Record<string, unknown> | null): boolean {
  if (!profile) return false;
  const pi = (profile.personalInfo || {}) as Record<string, unknown>;
  const hasCorePersonalInfo =
    typeof pi.fullName === "string" &&
    pi.fullName.trim().length > 0 &&
    typeof pi.email === "string" &&
    pi.email.trim().length > 0 &&
    typeof pi.location === "string" &&
    pi.location.trim().length > 0;

  const hasSomeResumeData =
    (Array.isArray(profile.experience) && profile.experience.length > 0) ||
    (Array.isArray(profile.projects) && profile.projects.length > 0) ||
    (Array.isArray(profile.education) && profile.education.length > 0) ||
    (Array.isArray(profile.skills) && profile.skills.length > 0);

  return hasCorePersonalInfo && hasSomeResumeData;
}

function formatTimestamp(ts?: TimestampLike): string {
  if (ts?.toDate) return ts.toDate().toLocaleDateString();
  return "Recently";
}

function cleanDisplayText(value: string | undefined, fallback: string, max = 72): string {
  const raw = (value || "").replace(/\s+/g, " ").trim();
  if (!raw) return fallback;
  if (raw.length <= max) return raw;
  return `${raw.slice(0, max - 1).trim()}…`;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [userData, setUserData] = useState<Record<string, unknown> | null>(null);
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [downloads, setDownloads] = useState<DownloadSummary[]>([]);
  const [activeHistoryTab, setActiveHistoryTab] = useState<"generated" | "downloads">("generated");
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user?.email) {
      const fetchSummary = async () => {
        try {
          const res = await fetch("/api/dashboard/summary");
          const payload = (await res.json()) as { success?: boolean; data?: SummaryPayload };
          const data = payload?.data || {};
          const profile = data.profile || null;
          setProfileComplete(isProfileComplete(profile as Record<string, unknown> | null));

          setUserData({ ...(data.user || {}), ...(profile || {}) });
          setResumes(Array.isArray(data.resumes) ? data.resumes : []);
          setDownloads(Array.isArray(data.downloads) ? data.downloads : []);
        } catch (e) {
          console.error("Dashboard summary load failed:", e);
        } finally {
          setLoading(false);
        }
      };

      fetchSummary();
    }
  }, [status, session, router]);

  if (status === "loading" || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#040a17]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Loader2 className="animate-spin text-slate-400" size={32} />
            <div className="absolute inset-0 rounded-full bg-indigo-400/20 animate-ping" />
          </div>
          <span className="text-sm font-medium text-slate-500 animate-pulse">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  const credits = (userData?.credits as number) || 0;
  const planType = ((userData?.planType as string) || "free").toLowerCase();
  const isPremium =
    Number(userData?.isPremium || 0) > 0 || ["standard", "premium", "pro"].includes(planType);

  const firstName = session?.user?.name?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const historyRows =
    activeHistoryTab === "generated"
      ? resumes.slice(0, 8).map((resume) => ({
          id: resume.id,
          primary: cleanDisplayText(resume.title || resume.targetRole, "Generated Resume", 78),
          secondary: resume.templateId ? `Template: ${resume.templateId}` : "AI generated",
          when: formatTimestamp(resume.createdAt),
          href: `/editor/${resume.id}`,
        }))
      : downloads.slice(0, 8).map((item) => ({
          id: item.id,
          primary: cleanDisplayText(item.filename, "Resume Download", 66),
          secondary: item.templateId ? `Template: ${item.templateId}` : "PDF download",
          when: formatTimestamp(item.createdAt),
          href: item.resumeId ? `/editor/${item.resumeId}` : "/dashboard",
        }));

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#030814] text-slate-100">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(81,127,255,0.25),transparent_33%),radial-gradient(circle_at_85%_32%,rgba(144,66,255,0.2),transparent_40%),radial-gradient(circle_at_75%_82%,rgba(57,133,255,0.18),transparent_42%)]" />
      </div>

      <DashboardHeader isPremium={isPremium} />

      <main className="relative z-10 mx-auto w-full max-w-[1120px] px-4 pb-12 pt-10 sm:px-6 lg:px-8">
        <section className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xl sm:text-2xl text-slate-300">
              {greeting}, {firstName}.
            </p>
            <h1 className="mt-1 text-5xl font-bold tracking-tight text-white sm:text-6xl">Dashboard</h1>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[460px]">
            <MiniStat label="Credits" value={credits} icon={<Coins size={18} />} />
            <MiniStat label="Plan" value={planType === "free" ? "Free" : "Pro"} icon={<WalletCards size={18} />} />
            <MiniStat label="Resumes" value={resumes.length} icon={<FileText size={18} />} />
          </div>
        </section>

        {!isPremium && (
          <div className="mb-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <p>Upgrade to unlock premium templates and higher generation limits.</p>
              <Link href="/pricing" className="rounded-lg bg-amber-400/20 px-3 py-1.5 font-semibold text-amber-100 hover:bg-amber-400/30">
                Upgrade Plan
              </Link>
            </div>
          </div>
        )}

        {!profileComplete && (
          <div className="mb-4 rounded-2xl border border-sky-400/30 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <p>Complete your profile to start resume generation.</p>
              <Link href="/onboarding" className="rounded-lg bg-sky-400/20 px-3 py-1.5 font-semibold text-sky-100 hover:bg-sky-400/30">
                Complete Profile
              </Link>
            </div>
          </div>
        )}

        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <ActionCard
            href="/builder"
            title="Create New Resume"
            cta="Start Now"
            icon={<FileText size={24} className="text-[#9bc2ff]" />}
          />
          <ActionCard
            href="/linkedin-audit"
            title="LinkedIn Audit"
            cta="Analyze Profile"
            icon={<Linkedin size={24} className="text-[#9bc2ff]" />}
          />
          <ActionCard
            href="/resume-score"
            title="Resume Score"
            cta="Check Score"
            icon={<BarChart3 size={24} className="text-[#9bc2ff]" />}
          />
        </section>

        <section className="glass-card rounded-3xl px-5 py-5 sm:px-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">Recent Activity</h2>
            <div className="inline-flex rounded-xl border border-white/[0.12] bg-white/[0.03] p-1 text-sm">
              <button
                className={
                  activeHistoryTab === "generated"
                    ? "rounded-lg bg-white/[0.12] px-3 py-1.5 font-semibold text-white"
                    : "rounded-lg px-3 py-1.5 text-slate-300 hover:text-white"
                }
                onClick={() => setActiveHistoryTab("generated")}
              >
                Generated
              </button>
              <button
                className={
                  activeHistoryTab === "downloads"
                    ? "rounded-lg bg-white/[0.12] px-3 py-1.5 font-semibold text-white"
                    : "rounded-lg px-3 py-1.5 text-slate-300 hover:text-white"
                }
                onClick={() => setActiveHistoryTab("downloads")}
              >
                Downloads
              </button>
            </div>
          </div>

          <div className="divide-y divide-white/[0.08]">
            {historyRows.length > 0 ? (
              historyRows.map((row) => (
                <Link
                  key={`${activeHistoryTab}-${row.id}`}
                  href={row.href}
                  className="group flex items-center justify-between gap-3 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-white sm:text-lg">{row.primary}</p>
                    <p className="mt-1 text-xs text-slate-300 sm:text-sm">
                      {row.secondary} <span className="text-slate-500">• {row.when}</span>
                    </p>
                  </div>
                  <ArrowRight size={18} className="shrink-0 text-slate-500 transition group-hover:translate-x-1 group-hover:text-indigo-300" />
                </Link>
              ))
            ) : (
              <div className="py-10 text-center text-slate-400">
                <p className="text-xl">
                  No {activeHistoryTab === "generated" ? "generated resumes" : "download history"} yet.
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {activeHistoryTab === "generated"
                    ? "Start by creating your first resume."
                    : "Downloaded files will appear here."}
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function MiniStat({ label, value, icon }: { label: string; value: string | number; icon: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.14] bg-[linear-gradient(130deg,rgba(26,43,80,0.84),rgba(17,28,55,0.84))] px-4 py-3.5 shadow-[0_12px_34px_rgba(10,16,33,0.38)]">
      <div className="flex items-center gap-3">
        <span className="text-slate-300">{icon}</span>
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ActionCard({
  href,
  title,
  cta,
  icon,
}: {
  href: string;
  title: string;
  cta: string;
  icon: ReactNode;
}) {
  return (
    <Link href={href} className="group block">
      <div className="rounded-3xl border border-[#5f74c7]/55 bg-[linear-gradient(130deg,rgba(28,45,83,0.88),rgba(18,30,57,0.84))] p-6 text-center shadow-[0_0_26px_rgba(126,78,255,0.18)] transition-all duration-200 hover:border-[#7d8ce8]/70 hover:shadow-[0_0_34px_rgba(126,78,255,0.22)]">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#293778]">
          {icon}
        </div>
        <h3 className="text-3xl font-semibold leading-tight text-white">{title}</h3>
        <div className="mt-6 rounded-xl bg-gradient-to-r from-[#7448ff] to-[#a03dff] px-5 py-2.5 text-xl font-semibold text-white transition group-hover:brightness-110">
          {cta}
        </div>
      </div>
    </Link>
  );
}
