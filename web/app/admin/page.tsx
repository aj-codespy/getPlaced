"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isAdmin } from "@/lib/admin";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import {
  Loader2,
  Users,
  FileText,
  Database,
  GraduationCap,
  Server,
  Coins,
  Search,
  SlidersHorizontal,
  Plus,
  ArrowUpRight,
} from "lucide-react";
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Link from "next/link";

interface UserProfile {
  email: string;
  name?: string;
  credits?: number;
  plan?: string;
  createdAt: string;
  isPremium?: number;
  planType?: string;
}

interface MetricsData {
  totalUsers: number;
  newUsersCount: number;
  paidUsersCount: number;
  totalCreditsInSystem: number;
  totalResumes: number;
  mostPopularTemplate: string;
  totalRevenue: string;
  totalTokens: number;
  totalCost: string;
  topInstitutions: { name: string; count: number }[];
  growthRate: string | number;
  tokensChartData: { date: string, input: number, output: number, total: number }[];
}

interface AdminData {
  metrics: MetricsData;
  recentUsers: UserProfile[];
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    
    if (status === "authenticated") {
        if (!isAdmin(session?.user?.email)) {
            router.push("/dashboard");
            return;
        }

        const fetchMetrics = async () => {
             try {
                 const res = await fetch("/api/admin/metrics");
                 if (res.ok) {
                     const result = await res.json();
                     setData(result);
                 } else {
                     console.error("Failed fetching metrics", await res.text());
                 }
             } catch(e) {
                 console.error(e);
             } finally {
                 setLoading(false);
             }
        };

        fetchMetrics();
    }
  }, [status, router, session]);

  if (status === "loading" || loading) return (
    <div className="h-screen flex items-center justify-center bg-[#05070d]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Loader2 className="animate-spin text-slate-400" size={32} />
          <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-indigo-400" />
        </div>
        <span className="text-sm text-slate-500 font-medium animate-pulse">Loading admin access...</span>
      </div>
    </div>
  );

  const { metrics, recentUsers } = data || {};
  const growthRateNum = Number(metrics?.growthRate || 0);
  const paidShare = metrics?.totalUsers
    ? Math.min(100, Math.round(((metrics?.paidUsersCount || 0) / metrics.totalUsers) * 100))
    : 0;
  const performanceScore = Math.max(6, Math.min(100, paidShare || Math.round(growthRateNum * 2)));
  const tokenTrendData = (metrics?.tokensChartData || []).map((d) => ({
    ...d,
    displayDate: new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  }));

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#05070d] font-sans text-slate-200">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-0 h-72 w-72 rounded-full bg-blue-500/10 blur-[110px]" />
        <div className="absolute top-40 right-[-8rem] h-96 w-96 rounded-full bg-cyan-500/10 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-sky-400/10 blur-[120px]" />
      </div>
      <DashboardHeader />

      <main className="relative mx-auto w-full max-w-[1320px] flex-1 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-2xl border border-white/10 bg-[#0d111b]/85 px-4 py-3 backdrop-blur-xl sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-md">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                readOnly
                value="Search metrics, users, templates..."
                className="w-full rounded-xl border border-white/10 bg-white/[0.02] py-2.5 pl-9 pr-3 text-sm text-slate-400 outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-white/[0.07]">
                <SlidersHorizontal size={13} /> Filters
              </button>
              <button className="inline-flex items-center gap-2 rounded-xl border border-blue-400/30 bg-blue-500/80 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-400/90">
                <Plus size={13} /> Add Widget
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">Track product growth, user behavior, and system economics.</p>
        </div>

        <section className="grid gap-4 lg:grid-cols-12">
          <div className="rounded-2xl border border-white/10 bg-[#0d111b]/90 p-5 backdrop-blur-xl lg:col-span-5">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Product Overview</p>
                <p className="mt-2 text-3xl font-semibold text-white">{metrics?.totalRevenue || "₹0"}</p>
                <p className="mt-1 text-xs text-slate-500">Estimated revenue tracked from successful transactions</p>
              </div>
              <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-slate-300">This month</span>
            </div>
            <div className="mb-5 flex items-end justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-sm text-slate-300">New users today</p>
                <p className="text-2xl font-semibold text-white">{metrics?.newUsersCount ?? 0}</p>
              </div>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                +{growthRateNum.toFixed(1)}%
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MiniBlock label="Total users" value={metrics?.totalUsers ?? 0} />
              <MiniBlock label="Paid users" value={metrics?.paidUsersCount ?? 0} />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0d111b]/90 p-5 backdrop-blur-xl lg:col-span-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">System Economics</p>
              <ArrowUpRight size={14} className="text-blue-300" />
            </div>
            <div className="space-y-3">
              <MetricRow label="Total resumes" value={metrics?.totalResumes ?? 0} icon={<FileText size={14} />} />
              <MetricRow label="Credits in system" value={metrics?.totalCreditsInSystem?.toLocaleString() || 0} icon={<Coins size={14} />} />
              <MetricRow label="Tokens used" value={metrics?.totalTokens?.toLocaleString() || 0} icon={<Server size={14} />} />
              <MetricRow label="Gemini cost" value={metrics?.totalCost || "$0"} icon={<Database size={14} />} />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0d111b]/90 p-5 backdrop-blur-xl lg:col-span-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Paid Conversion</p>
            <div className="mt-5 flex items-center justify-center">
              <div
                className="relative h-28 w-28 rounded-full"
                style={{
                  background: `conic-gradient(#4f8cff ${paidShare * 3.6}deg, #9ad8ff ${Math.min(360, paidShare * 3.6 + 20)}deg, #1d2434 0deg)`,
                }}
              >
                <div className="absolute inset-[10px] flex items-center justify-center rounded-full bg-[#0b101a]">
                  <span className="text-2xl font-semibold text-white">{paidShare}%</span>
                </div>
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-slate-400">Share of users on paid plans</p>
          </div>
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-12">
          <div className="rounded-2xl border border-white/10 bg-[#0d111b]/90 p-5 backdrop-blur-xl xl:col-span-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">Token Utilization Trend</h3>
                <p className="text-xs text-slate-500">Input vs output token usage over time</p>
              </div>
              <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-slate-300">This year</span>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={tokenTrendData} margin={{ top: 8, right: 6, left: 6, bottom: 0 }}>
                  <defs>
                    <linearGradient id="adminInputFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f8cff" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#4f8cff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="adminOutputFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8fd6ff" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#8fd6ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#223046" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="displayDate" stroke="#70829e" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0b111d",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "12px",
                      fontSize: "12px",
                      color: "#e2e8f0",
                    }}
                  />
                  <Area type="monotone" dataKey="input" name="Input tokens" stroke="#4f8cff" strokeWidth={2.5} fill="url(#adminInputFill)" />
                  <Area type="monotone" dataKey="output" name="Output tokens" stroke="#8fd6ff" strokeWidth={2} fill="url(#adminOutputFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0d111b]/90 p-5 backdrop-blur-xl xl:col-span-4">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">System Performance</h3>
              <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-slate-300">Live</span>
            </div>
            <div className="flex items-center justify-center">
              <div
                className="relative h-44 w-44 rounded-full"
                style={{
                  background: `conic-gradient(#4f8cff ${performanceScore * 3.6}deg, #9ad8ff ${Math.min(360, performanceScore * 3.6 + 36)}deg, #1d2434 0deg)`,
                }}
              >
                <div className="absolute inset-[14px] rounded-full bg-[#0b101a]" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-semibold text-white">{performanceScore}%</span>
                  <span className="text-xs text-slate-500">Since yesterday</span>
                </div>
              </div>
            </div>
            <div className="mt-5 space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs">
              <LegendRow label="New users (24h)" value={metrics?.newUsersCount ?? 0} accent="bg-blue-400" />
              <LegendRow label="Paid conversion" value={`${paidShare}%`} accent="bg-cyan-300" />
              <LegendRow label="Growth rate" value={`${growthRateNum.toFixed(1)}%`} accent="bg-emerald-400" />
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-12">
          <div className="rounded-2xl border border-white/10 bg-[#0d111b]/90 p-5 backdrop-blur-xl xl:col-span-4">
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
              <GraduationCap size={16} className="text-blue-300" /> Top Institutions
            </h3>
            <div className="space-y-3">
              {metrics?.topInstitutions?.length ? (
                metrics.topInstitutions.map((inst, idx) => (
                  <div key={`${inst.name}-${idx}`} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="truncate pr-3 text-sm text-slate-200">{inst.name}</p>
                      <span className="rounded-md bg-blue-500/15 px-2 py-0.5 text-[11px] font-semibold text-blue-300">{inst.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.08]">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-blue-400 to-cyan-300"
                        style={{ width: `${Math.min(100, inst.count * 10)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No institution data extracted yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0d111b]/90 p-5 backdrop-blur-xl xl:col-span-8">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base font-semibold text-white">
                <Users size={16} className="text-blue-300" /> Recent Users
              </h3>
              <Link href="/admin/users" className="text-xs font-semibold text-blue-300 hover:text-blue-200">
                View all users
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm text-slate-300">
                <thead className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr className="border-b border-white/10">
                    <th className="pb-3 font-semibold">User</th>
                    <th className="pb-3 font-semibold">Credits</th>
                    <th className="pb-3 font-semibold">Plan</th>
                    <th className="pb-3 font-semibold">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers?.slice(0, 10).map((u, idx) => (
                    <tr key={`${u.email}-${idx}`} className="border-b border-white/5 last:border-0">
                      <td className="py-3">
                        <p className="font-medium text-slate-100">{u.name || "Unknown"}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </td>
                      <td className="py-3 font-mono text-xs">{u.credits ?? 0}</td>
                      <td className="py-3">
                        <span className={`rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                          u.plan === "free" ? "bg-white/10 text-slate-300" : "bg-blue-500/20 text-blue-200"
                        }`}>
                          {u.plan || "free"}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!recentUsers?.length && (
                <p className="py-8 text-center text-sm text-slate-500">No users found yet.</p>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function MiniBlock({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function MetricRow({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5">
      <div className="flex items-center gap-2.5 text-slate-400">
        <span className="text-blue-300">{icon}</span>
        <span className="text-xs uppercase tracking-[0.12em]">{label}</span>
      </div>
      <span className="font-semibold text-slate-100">{value}</span>
    </div>
  );
}

function LegendRow({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="inline-flex items-center gap-2 text-slate-400">
        <span className={`h-2.5 w-2.5 rounded-full ${accent}`} />
        {label}
      </span>
      <span className="font-semibold text-slate-200">{value}</span>
    </div>
  );
}
