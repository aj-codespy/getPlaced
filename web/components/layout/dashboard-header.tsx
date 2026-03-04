"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { Sparkles, User, LogOut, Crown, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Builder", href: "/builder" },
  { label: "Resume Score", href: "/resume-score" },
  { label: "LinkedIn Audit", href: "/linkedin-audit" },
];

export function DashboardHeader({ credits }: { credits?: number }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const displayCredits = credits ?? 0;
  const isLowCredits = displayCredits < 100;

  return (
    <header className="border-b border-white/[0.04] sticky top-0 bg-[#030712]/70 backdrop-blur-xl z-50 w-full">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="font-bold text-lg hover:opacity-80 transition-opacity flex items-center gap-2.5 text-white group"
        >
          <div className="relative h-8 w-8 shrink-0">
            <Image
              src="/logo.png"
              alt="getPlaced"
              width={32}
              height={32}
              className="drop-shadow-[0_0_8px_rgba(99,102,241,0.35)] group-hover:drop-shadow-[0_0_14px_rgba(99,102,241,0.55)] transition-all duration-300"
            />
          </div>
          <span className="hidden sm:inline">getPlaced</span>
        </Link>

        {/* Center Nav */}
        <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] border border-white/[0.05] rounded-full px-1.5 py-1">
          {[...NAV_ITEMS, ...(isAdmin(session?.user?.email) ? [{ label: "Admin", href: "/admin" }] : [])].map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  relative px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-300
                  ${isActive
                    ? "text-white bg-white/[0.08] shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                  }
                `}
              >
                {item.label}
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-gradient-to-r from-slate-400 to-slate-300 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Credit Pill */}
          <Link href="/pricing" className="hidden sm:flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-full px-3.5 py-1.5 hover:bg-white/[0.07] transition-all group">
            <Crown size={13} className="text-slate-400" />
            <span className={`text-xs font-bold tabular-nums ${isLowCredits ? "text-amber-400 animate-pulse" : "text-white"}`}>
              {displayCredits}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">CR</span>
          </Link>

          {/* Avatar Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 group"
            >
              <div className="h-8 w-8 rounded-full bg-white/[0.08] border border-white/[0.10] flex items-center justify-center text-white text-xs font-bold group-hover:bg-white/[0.12] transition-all">
                {session?.user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-[#0f1629]/95 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl shadow-black/40 py-2 animate-slide-up z-50">
                {/* User info */}
                <div className="px-4 py-3 border-b border-white/[0.05]">
                  <p className="text-sm font-semibold text-white truncate">{session?.user?.name || "User"}</p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{session?.user?.email}</p>
                </div>
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors"
                >
                  <User size={15} /> Profile
                </Link>
                <Link
                  href="/referrals"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors"
                >
                  <Sparkles size={15} /> Referrals
                </Link>
                <div className="border-t border-white/[0.05] mt-1 pt-1">
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors w-full"
                  >
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
