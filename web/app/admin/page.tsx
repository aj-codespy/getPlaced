"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isAdmin } from "@/lib/admin";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Loader2, Users, TrendingUp, DollarSign, FileText, Database, GraduationCap, Server, Coins, LayoutTemplate } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
  growthRate: string;
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
    <div className="h-screen flex items-center justify-center bg-transparent">
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

  return (
    <div className="flex min-h-screen flex-col font-sans text-slate-200">
      <DashboardHeader />
      
      <main className="container mx-auto px-6 py-10 flex-1">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-white tracking-tight">Admin Dashboard</h1>
            <p className="text-slate-500 mt-1 text-sm">System metrics, growth, and user base tracking.</p>
        </div>

        {/* Global Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
          <AdminStat label="Total Users" value={metrics?.totalUsers} icon={<Users size={16} />} trend={`+${metrics?.newUsersCount} today`} />
          <AdminStat label="Paid Users" value={metrics?.paidUsersCount} icon={<DollarSign size={16} className="text-emerald-400" />} />
          <AdminStat label="Growth Rate" value={`${metrics?.growthRate || 0}%`} icon={<TrendingUp size={16} className="text-blue-400" />} />
          <AdminStat label="Est. Revenue" value={`$${metrics?.totalRevenue || 0}`} icon={<DollarSign size={16} className="text-emerald-400" />} />
          
          <AdminStat label="Total Resumes" value={metrics?.totalResumes} icon={<FileText size={16} />} />
          <AdminStat label="Pop. Template" value={metrics?.mostPopularTemplate} icon={<LayoutTemplate size={16} className="text-indigo-400" />} />
          <AdminStat label="Sys. Credits" value={metrics?.totalCreditsInSystem?.toLocaleString()} icon={<Coins size={16} className="text-amber-400" />} />
          <AdminStat label="Tokens Used" value={metrics?.totalTokens?.toLocaleString()} icon={<Server size={16} className="text-purple-400" />} />
          <AdminStat label="Cost (Est)" value={metrics?.totalCost || "$0"} icon={<Database size={16} className="text-red-400" />} sub="Gemini 2.5 Flash" />
        </div>

        {/* Graphs Section */}
        {metrics?.tokensChartData && metrics.tokensChartData.length > 0 && (
          <div className="glass-card p-6 rounded-2xl mb-8">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-white flex items-center gap-2"><TrendingUp size={16} className="text-indigo-400"/> Daily Token Utilization & Cost</h3>
                <span className="text-xs text-slate-500 bg-white/5 px-3 py-1 rounded-full">Gemini 2.5 Flash</span>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={metrics.tokensChartData.map(d => ({
                      ...d, 
                      displayDate: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                      cost: (d.total * (0.30 / 1_000_000)).toFixed(4)
                  }))}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorInput" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOutput" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c084fc" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#c084fc" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                  <XAxis 
                    dataKey="displayDate" 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    yAxisId="left"
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
                    dx={-10}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `$${val}`}
                    dx={10}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f1629', borderColor: '#ffffff1a', borderRadius: '12px', fontSize: '12px', color: '#f1f5f9' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Area yAxisId="left" type="monotone" dataKey="input" name="Input Tokens" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#colorInput)" />
                  <Area yAxisId="left" type="monotone" dataKey="output" name="Output Tokens" stroke="#c084fc" strokeWidth={2} fillOpacity={1} fill="url(#colorOutput)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Breakdown section */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="col-span-1 glass-card p-6 rounded-2xl">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><GraduationCap size={16} /> Top Institutions</h3>
                <div className="space-y-3">
                    {metrics?.topInstitutions?.map((inst, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-slate-300 truncate pr-4">{inst.name}</span>
                            <span className="bg-white/5 px-2 py-0.5 rounded-md text-xs font-bold text-slate-400">{inst.count}</span>
                        </div>
                    ))}
                    {!metrics?.topInstitutions?.length && <p className="text-xs text-slate-500">No data extracted.</p>}
                </div>
            </div>

            <div className="col-span-2 glass-card p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white flex items-center gap-2"><Users size={16} /> Recent Users (Last 30)</h3>
                    <Link href="/admin/users" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium hover:underline flex items-center gap-1 transition-colors">
                        View All
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left align-middle text-slate-400">
                        <thead className="text-xs uppercase bg-white/[0.03] text-slate-500">
                            <tr>
                                <th className="px-4 py-3 font-semibold rounded-tl-lg">User</th>
                                <th className="px-4 py-3 font-semibold">Credits</th>
                                <th className="px-4 py-3 font-semibold">Plan</th>
                                <th className="px-4 py-3 font-semibold rounded-tr-lg">Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentUsers?.map((u, idx: number) => (
                                <tr key={idx} className="border-b border-white/[0.03] hover:bg-white/[0.01]">
                                    <td className="px-4 py-3 text-slate-300">
                                        <div className="font-medium">{u.name || "Unknown"}</div>
                                        <div className="text-xs text-slate-500">{u.email}</div>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs">{u.credits}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${u.plan === "free" ? "bg-white/5 text-slate-400" : "bg-indigo-500/20 text-indigo-400"}`}>
                                            {u.plan}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs">
                                        {new Date(u.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!recentUsers?.length && <p className="text-xs text-slate-500 mt-4 text-center">No users found.</p>}
                </div>
            </div>
        </div>

      </main>
    </div>
  );
}

function AdminStat({ label, value, icon, trend, sub }: { label: string, value?: string | number, icon: React.ReactNode, trend?: string, sub?: string }) {
  return (
    <div className="glass-card rounded-xl p-5 relative overflow-hidden group">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-8 w-8 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
          <span className="text-slate-400 group-hover:text-white transition-colors">{icon}</span>
        </div>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</p>
      </div>
      <div>
        <p className="text-2xl font-bold text-white tabular-nums">{value ?? "—"}</p>
        {trend && <p className="text-xs text-emerald-400 font-medium mt-1">{trend}</p>}
        {sub && <p className="text-xs text-slate-500 font-medium mt-1">{sub}</p>}
      </div>
    </div>
  );
}
