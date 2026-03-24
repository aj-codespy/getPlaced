"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { User, LogOut, Sparkles, Menu, X, Bell, ArrowUpRight } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";

const BASE_NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Builder", href: "/builder" },
  { label: "Resume Score", href: "/resume-score" },
  { label: "LinkedIn Audit", href: "/linkedin-audit" },
];

export function DashboardHeader({ isPremium }: { credits?: number; isPremium?: boolean }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (mobileNavRef.current && !mobileNavRef.current.contains(e.target as Node)) {
        setMobileNavOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const navItems = [
    ...BASE_NAV_ITEMS,
    ...(isPremium === false ? [{ label: "Upgrade", href: "/pricing" }] : []),
    ...(isAdmin(session?.user?.email) ? [{ label: "Admin", href: "/admin" }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#070e1d]/88 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 w-full max-w-[1360px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-white">
            <div className="relative h-7 w-7 shrink-0">
              <Image
                src="/logo.png"
                alt="getPlaced"
                width={32}
                height={32}
                className="drop-shadow-[0_0_10px_rgba(99,102,241,0.45)]"
              />
            </div>
            <span className="text-lg tracking-tight md:text-xl">getPlaced</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-slate-300 lg:flex">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    isActive
                      ? "font-semibold text-white"
                      : "font-medium text-slate-300 transition-colors hover:text-white"
                  }
                >
                  <span className="inline-flex items-center gap-1.5">
                    {item.label}
                    {item.label === "Upgrade" && <ArrowUpRight size={14} className="text-amber-300" />}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.03] text-slate-300 hover:bg-white/[0.08] hover:text-white"
            aria-label="Notifications"
          >
            <Bell size={15} />
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => {
                setMenuOpen((prev) => !prev);
                setMobileNavOpen(false);
              }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.03] text-slate-200 hover:bg-white/[0.08]"
              aria-label="Account menu"
            >
              <span className="text-sm font-semibold">
                {session?.user?.name?.[0]?.toUpperCase() || "U"}
              </span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-3 w-56 rounded-xl border border-white/[0.1] bg-[#0d1528]/96 py-2 shadow-2xl shadow-black/45">
                <div className="border-b border-white/[0.08] px-4 py-3">
                  <p className="truncate text-sm font-semibold text-white">{session?.user?.name || "User"}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-400">{session?.user?.email}</p>
                </div>
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/[0.05] hover:text-white"
                >
                  <User size={15} /> Profile
                </Link>
                <Link
                  href="/referrals"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/[0.05] hover:text-white"
                >
                  <Sparkles size={15} /> Referrals
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="mt-1 flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-300 transition-colors hover:bg-white/[0.05] hover:text-white"
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setMobileNavOpen((prev) => !prev);
              setMenuOpen(false);
            }}
            aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.03] text-slate-300 hover:bg-white/[0.08] hover:text-white lg:hidden"
          >
            {mobileNavOpen ? <X size={15} /> : <Menu size={15} />}
          </button>
        </div>
      </div>

      {mobileNavOpen && (
        <div ref={mobileNavRef} className="border-t border-white/[0.08] bg-[#070e1d]/95 px-4 py-4 sm:px-6 lg:hidden">
          <nav className="grid gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={`mobile-${item.href}`}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={
                    isActive
                      ? "rounded-lg border border-white/[0.15] bg-white/[0.08] px-3 py-2.5 text-sm font-semibold text-white"
                      : "rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-slate-300 hover:bg-white/[0.07] hover:text-white"
                  }
                >
                  <span className="inline-flex items-center gap-1.5">
                    {item.label}
                    {item.label === "Upgrade" && <ArrowUpRight size={13} className="text-amber-300" />}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
