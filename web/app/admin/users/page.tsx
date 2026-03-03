"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isAdmin } from "@/lib/admin";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Loader2, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  credits?: number;
  plan?: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
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

        const fetchUsers = async () => {
             try {
                 const res = await fetch("/api/admin/users");
                 if (res.ok) {
                     const result = await res.json();
                     setUsers(result.users);
                 }
             } catch(e) {
                 console.error(e);
             } finally {
                 setLoading(false);
             }
        };

        fetchUsers();
    }
  }, [status, router, session]);

  if (status === "loading" || loading) return (
    <div className="h-screen flex items-center justify-center bg-transparent">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Loader2 className="animate-spin text-slate-400" size={32} />
          <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-indigo-400" />
        </div>
        <span className="text-sm text-slate-500 font-medium animate-pulse">Loading all users data...</span>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col font-sans text-slate-200">
      <DashboardHeader />
      
      <main className="container mx-auto px-6 py-10 flex-1">
        <div className="flex items-center justify-between mb-8">
            <div>
                <Link href="/admin" className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-medium mb-4 transition-colors">
                    <ArrowLeft size={16} /> Back to Dashboard
                </Link>
                <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                    <Users className="text-indigo-400" size={28} /> All Users
                </h1>
                <p className="text-slate-500 mt-1 text-sm">A complete chronological log of all registered platform users.</p>
            </div>
            <div className="flex items-center gap-3">
                <span className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-sm font-bold text-slate-300">
                    Total: {users.length}
                </span>
            </div>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden shadow-2xl shadow-black/20">
            <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
                <table className="w-full text-sm text-left align-middle text-slate-400 relative">
                    <thead className="text-xs uppercase bg-[#0f1629] text-slate-500 sticky top-0 z-10 shadow-md">
                        <tr>
                            <th className="px-6 py-4 font-semibold">User</th>
                            <th className="px-6 py-4 font-semibold">Email</th>
                            <th className="px-6 py-4 font-semibold">Credits</th>
                            <th className="px-6 py-4 font-semibold">Plan</th>
                            <th className="px-6 py-4 font-semibold">Registered Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                        {users.map((u, idx) => (
                            <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-6 py-4 text-slate-200 font-medium">
                                    {u.name || "Unknown"}
                                </td>
                                <td className="px-6 py-4 text-slate-400">
                                    {u.email}
                                </td>
                                <td className="px-6 py-4 font-mono text-xs text-indigo-300">
                                    {u.credits ?? 0}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${u.plan === "free" ? "bg-white/5 text-slate-400" : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/20"}`}>
                                        {u.plan || "FREE"}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-400 text-xs">
                                    {new Date(u.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {users.length === 0 && (
                    <div className="p-8 text-center text-slate-500">
                        No users found in database.
                    </div>
                )}
            </div>
        </div>

      </main>
    </div>
  );
}
