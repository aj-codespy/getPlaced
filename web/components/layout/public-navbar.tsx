"use client";

import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const NAV_LINKS = [
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "FAQ", href: "/faq" },
];

interface PublicNavbarProps {
  currentPath: string;
}

export function PublicNavbar({ currentPath }: PublicNavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="relative z-50 border-b border-white/[0.08] bg-[#080f21]/80 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 w-full max-w-[1240px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight">
          <div className="relative h-8 w-8 shrink-0">
            <Image src="/logo.png" alt="getPlaced" width={36} height={36} className="drop-shadow-[0_0_14px_rgba(117,120,255,0.45)]" />
          </div>
          <span className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-xl text-transparent md:text-2xl">
            getPlaced
          </span>
        </Link>

        <nav className="hidden items-center gap-9 text-base font-medium text-slate-300 lg:flex">
          {NAV_LINKS.map((item) => {
            const active = currentPath === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "text-white" : "text-slate-300 transition-colors hover:text-white"}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <Link
            href="/login"
            className="rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-white/[0.06]"
          >
            Log in
          </Link>
          <Link href="/signup">
            <span className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6958ff] to-[#8a41ff] px-5 py-2 text-sm font-semibold text-white shadow-[0_10px_26px_rgba(112,70,255,0.4)] transition-transform hover:scale-[1.02]">
              Get started free
              <ArrowRight size={15} />
            </span>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/[0.03] text-slate-100 lg:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X size={16} /> : <Menu size={16} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/[0.08] bg-[#080f21]/95 px-4 py-4 sm:px-6 lg:hidden">
          <nav className="grid gap-2 text-sm text-slate-200">
            {NAV_LINKS.map((item) => (
              <Link
                key={`mobile-${item.href}`}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 hover:bg-white/[0.08]"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 hover:bg-white/[0.08]"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#6958ff] to-[#8a41ff] px-3 py-2.5 font-semibold text-white"
            >
              Get started free
              <ArrowRight size={15} />
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
