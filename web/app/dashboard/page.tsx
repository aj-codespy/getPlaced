"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import {
  Plus,
  CreditCard,
  Loader2,
  Sparkles,
  FileText,
  Target,
  BarChart3,
  ArrowRight,
  Zap,
  Crown,
  Gift,
  Download,
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
      <div className="h-screen flex items-center justify-center bg-transparent">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Loader2 className="animate-spin text-slate-400" size={32} />
            <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-indigo-400" />
          </div>
          <span className="text-sm text-slate-500 font-medium animate-pulse">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  const credits = (userData?.credits as number) || 0;
  const isLowCredits = credits < 100;
  const planType = ((userData?.planType as string) || "free").toLowerCase();
  const isPremium =
    Number(userData?.isPremium || 0) > 0 || ["standard", "premium", "pro"].includes(planType);
  const totalDownloads = (userData?.totalDownloads as number) || downloads.length || 0;

  const firstName = session?.user?.name?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const historyRows =
    activeHistoryTab === "generated"
      ? resumes.slice(0, 6).map((resume) => ({
          id: resume.id,
          primary: resume.targetRole || resume.title || "Generated Resume",
          secondary: resume.templateId ? `Template: ${resume.templateId}` : "AI generated",
          when: resume.createdAt?.toDate ? new Date(resume.createdAt.toDate()).toLocaleDateString() : "Recently",
          href: `/editor/${resume.id}`,
          icon: <FileText size={14} className="text-indigo-400 shrink-0" />,
        }))
      : downloads.slice(0, 6).map((item) => ({
          id: item.id,
          primary: item.filename || "Resume Download",
          secondary: item.templateId ? `Template: ${item.templateId}` : "PDF download",
          when: item.createdAt?.toDate ? new Date(item.createdAt.toDate()).toLocaleDateString() : "Recently",
          href: item.resumeId ? `/editor/${item.resumeId}` : "/dashboard",
          icon: <Download size={14} className="text-emerald-400 shrink-0" />,
        }));

  return (
    <div className="flex min-h-screen flex-col font-sans text-slate-200">
      <DashboardHeader credits={credits} isPremium={isPremium} />

      <main className="container mx-auto px-6 py-10 flex-1">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 gap-4 animate-slide-up">
          <div>
            <p className="text-sm text-indigo-400 font-medium mb-1">{greeting}, {firstName} ✦</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Dashboard</h2>
            <p className="text-slate-500 mt-1 text-sm">Create, optimize, and track your resumes.</p>
          </div>
          <Link href="/builder">
            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 border-0 h-11 px-6 rounded-xl group transition-all hover:shadow-indigo-500/30 hover:scale-[1.02]">
              <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform duration-300" /> Create New Resume
              <ArrowRight className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
            </Button>
          </Link>
        </div>

        {!isPremium && (
          <div className="mb-8 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-amber-300">You are on the Free plan</p>
              <p className="text-xs text-amber-100/80 mt-1">Unlock premium templates, higher limits, and faster workflows.</p>
            </div>
            <Link href="/pricing">
              <Button className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 text-amber-200">
                Upgrade Plan
              </Button>
            </Link>
          </div>
        )}

        {!profileComplete && (
          <div className="mb-8 rounded-2xl border border-sky-500/25 bg-sky-500/10 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-sky-300">Complete your profile to unlock resume generation</p>
              <p className="text-xs text-sky-100/80 mt-1">You can browse the dashboard now, but generation stays locked until profile details are filled.</p>
            </div>
            <Link href="/onboarding">
              <Button className="bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/30 text-sky-200">
                Complete Profile
              </Button>
            </Link>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 stagger-children">
          <StatCard label="Credits" value={credits} icon={<Crown size={18} />} />
          <StatCard label="Plan" value={(userData?.planType as string)?.toUpperCase() || "FREE"} icon={<Sparkles size={18} />} />
          <StatCard label="Resumes" value={resumes.length} icon={<FileText size={18} />} />
          <StatCard label="Downloads" value={totalDownloads} icon={<Zap size={18} />} />
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 stagger-children">
          <Link href="/builder" className="group block h-full">
            <div className="glass-card h-full min-h-[230px] rounded-2xl p-8 flex flex-col items-center justify-center gap-4 text-center cursor-pointer relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-white/[0.01] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <div className="h-14 w-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center group-hover:scale-110 group-hover:bg-white/[0.08] group-hover:border-white/[0.12] transition-all duration-500 z-10">
                <Plus size={26} className="text-slate-400 group-hover:text-white transition-colors duration-300" />
              </div>
              <div className="z-10">
                <h3 className="font-semibold text-lg text-white">Create New Resume</h3>
                <p className="text-sm text-slate-500 mt-1 group-hover:text-slate-400 transition-colors">AI-powered, ATS-optimized</p>
              </div>
            </div>
          </Link>

          <Link href="/linkedin-audit" className="group block h-full">
            <div className="glass-card h-full min-h-[230px] rounded-2xl p-8 flex flex-col items-center justify-center gap-4 text-center cursor-pointer relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-white/[0.01] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <div className="h-14 w-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center group-hover:scale-110 group-hover:bg-white/[0.08] group-hover:border-white/[0.12] transition-all duration-500 z-10">
                <Target size={26} className="text-slate-400 group-hover:text-white transition-colors duration-300" />
              </div>
              <div className="z-10">
                <h3 className="font-semibold text-lg text-white">LinkedIn Audit</h3>
                <p className="text-sm text-slate-500 mt-1 group-hover:text-slate-400 transition-colors">AI Profile Analysis & Tips</p>
              </div>
            </div>
          </Link>

          <Link href="/resume-score" className="group block h-full">
            <div className="glass-card h-full min-h-[230px] rounded-2xl p-8 flex flex-col items-center justify-center gap-4 text-center cursor-pointer relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-white/[0.01] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <div className="h-14 w-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center group-hover:scale-110 group-hover:bg-white/[0.08] group-hover:border-white/[0.12] transition-all duration-500 z-10">
                <BarChart3 size={26} className="text-slate-400 group-hover:text-white transition-colors duration-300" />
              </div>
              <div className="z-10">
                <h3 className="font-semibold text-lg text-white">Resume Score</h3>
                <p className="text-sm text-slate-500 mt-1 group-hover:text-slate-400 transition-colors">Free Rule-Based Analysis</p>
              </div>
            </div>
          </Link>

          <div className="col-span-1 lg:col-span-2 h-full">
            <div className="glass-card h-full min-h-[230px] rounded-2xl p-8 relative overflow-hidden group">
              <div className="absolute -top-20 -right-20 w-52 h-52 bg-indigo-500/8 rounded-full blur-3xl group-hover:bg-indigo-500/15 transition-colors duration-700" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-colors duration-700" />

              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-lg flex items-center gap-2.5 text-white">
                      <div className="h-8 w-8 rounded-lg bg-white/[0.06] flex items-center justify-center">
                        <CreditCard size={16} className="text-slate-400" />
                      </div>
                      {(userData?.planType as string)?.toUpperCase() || "FREE PLAN"}
                    </h3>
                    <span className="px-2.5 py-1 rounded-full text-[10px] bg-white/[0.06] text-slate-400 font-bold border border-indigo-500/20 tracking-wider">
                      ACTIVE
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2 mb-2">
                    <span className={`text-4xl font-black tracking-tight ${isLowCredits ? "text-amber-400" : "text-white"}`}>
                      {credits}
                    </span>
                    <span className="text-sm font-medium text-slate-500">credits available</span>
                  </div>

                  <div className="mt-3 w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 animate-progress-fill ${isLowCredits ? "bg-gradient-to-r from-amber-500 to-red-500" : "bg-gradient-to-r from-indigo-500 to-purple-500"}`}
                      style={{ width: `${Math.min((credits / 1000) * 100, 100)}%` }}
                    />
                  </div>

                  <p className="text-xs text-slate-600 mt-3">
                    {isLowCredits ? "Running low? 100 credits per generation/download." : `Enough for ${Math.floor(credits / 100)} generations.`}
                  </p>
                </div>

                <div className="flex gap-3 mt-6">
                  <Link href="/pricing" className="flex-1">
                    <Button
                      className={`w-full h-10 rounded-xl text-sm font-medium transition-all ${
                        isLowCredits
                          ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20"
                          : "bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.06]"
                      }`}
                      variant="outline"
                    >
                      {isLowCredits ? "Recharge Now" : isPremium ? "Manage Credits" : "Upgrade Plan"}
                    </Button>
                  </Link>
                  <Link href="/referrals">
                    <Button variant="outline" className="h-10 rounded-xl text-sm border-white/[0.06] text-slate-400 hover:text-white bg-white/[0.02] hover:bg-white/[0.05]">
                      <Gift size={15} className="mr-1.5" /> Refer
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card col-span-1 h-full min-h-[230px] rounded-2xl p-6 flex flex-col relative overflow-hidden">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-lg text-white">Activity</h3>
              <div className="inline-flex rounded-lg border border-white/10 bg-white/[0.03] p-1">
                <button
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                    activeHistoryTab === "generated" ? "bg-white/[0.12] text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                  onClick={() => setActiveHistoryTab("generated")}
                >
                  Generated
                </button>
                <button
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                    activeHistoryTab === "downloads" ? "bg-white/[0.12] text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                  onClick={() => setActiveHistoryTab("downloads")}
                >
                  Downloads
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {historyRows.length > 0 ? (
                historyRows.map((row) => (
                  <Link key={`${activeHistoryTab}-${row.id}`} href={row.href} className="block group/item">
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] group-hover/item:bg-white/[0.06] group-hover/item:border-white/[0.1] transition-all flex items-center justify-between">
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          {row.icon}
                          <p className="text-sm font-medium text-slate-200 group-hover/item:text-white transition-colors line-clamp-1">{row.primary}</p>
                        </div>
                        <p className="text-xs text-slate-500 pl-6 line-clamp-1">{row.secondary}</p>
                        <p className="text-[11px] text-slate-600 pl-6">{row.when}</p>
                      </div>
                      <ArrowRight size={14} className="text-slate-600 group-hover/item:text-indigo-400 group-hover/item:translate-x-1 transition-all shrink-0" />
                    </div>
                  </Link>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-6">
                  <div className="h-10 w-10 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mb-3">
                    {activeHistoryTab === "generated" ? (
                      <FileText size={16} className="text-slate-600" />
                    ) : (
                      <Download size={16} className="text-slate-600" />
                    )}
                  </div>
                  <p className="text-slate-500 text-sm font-medium">No {activeHistoryTab} data yet</p>
                  <p className="text-slate-600 text-xs mt-0.5">
                    {activeHistoryTab === "generated"
                      ? "Generated resumes will appear here"
                      : "Downloaded PDFs will appear here"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: ReactNode }) {
  return (
    <div className="glass-card rounded-xl p-4 group">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
          <span className="text-slate-400">{icon}</span>
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</p>
          <p className="text-lg font-bold text-white mt-0.5 tabular-nums">{value}</p>
        </div>
      </div>
    </div>
  );
}
